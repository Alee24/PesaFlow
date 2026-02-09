"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserLicenseKey = exports.purchaseEnterprisePlan = exports.activateUserLicenseKey = exports.getAllUserLicenseKeys = exports.generateUserLicenseKeys = void 0;
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
function generateLicenseKey() {
    const prefix = 'ENT';
    const random = crypto_1.default.randomBytes(16).toString('hex').toUpperCase();
    const checksum = crypto_1.default.createHash('sha256').update(random).digest('hex').substring(0, 4).toUpperCase();
    const formatted = random.match(/.{1,4}/g)?.join('-') || random;
    return `${prefix}-${formatted}-${checksum}`;
}
const generateUserLicenseKeys = async (req, res) => {
    try {
        const { count = 1, planType = 'ENTERPRISE', expiresInDays } = req.body;
        const keys = [];
        const expiresAt = expiresInDays
            ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
            : null;
        for (let i = 0; i < count; i++) {
            const licenseKey = generateLicenseKey();
            const key = await prisma.userLicenseKey.create({
                data: {
                    licenseKey,
                    planType,
                    generatedBy: req.user?.email || 'admin',
                    expiresAt
                }
            });
            keys.push(key);
        }
        res.json({
            success: true,
            message: `Generated ${count} license key(s)`,
            keys: keys.map(k => ({
                id: k.id,
                licenseKey: k.licenseKey,
                planType: k.planType,
                expiresAt: k.expiresAt
            }))
        });
    }
    catch (error) {
        console.error('Generate license keys error:', error);
        res.status(500).json({
            error: 'Failed to generate license keys',
            details: error.message
        });
    }
};
exports.generateUserLicenseKeys = generateUserLicenseKeys;
const getAllUserLicenseKeys = async (req, res) => {
    try {
        const { status } = req.query;
        const where = {};
        if (status === 'used') {
            where.isUsed = true;
        }
        else if (status === 'unused') {
            where.isUsed = false;
        }
        const keys = await prisma.userLicenseKey.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            }
        });
        const stats = {
            total: keys.length,
            used: keys.filter(k => k.isUsed).length,
            unused: keys.filter(k => !k.isUsed).length,
            expired: keys.filter(k => k.expiresAt && new Date(k.expiresAt) < new Date()).length
        };
        res.json({
            keys,
            stats
        });
    }
    catch (error) {
        console.error('Get license keys error:', error);
        res.status(500).json({
            error: 'Failed to fetch license keys',
            details: error.message
        });
    }
};
exports.getAllUserLicenseKeys = getAllUserLicenseKeys;
const activateUserLicenseKey = async (req, res) => {
    try {
        const { licenseKey, serverFingerprint, domain } = req.body;
        const userId = req.user?.userId;
        const userEmail = req.user?.email;
        if (!licenseKey) {
            return res.status(400).json({ error: 'License key is required' });
        }
        console.log(`[LICENSE] Attempting to activate key: '${licenseKey}'`);
        const key = await prisma.userLicenseKey.findUnique({
            where: { licenseKey: licenseKey.trim().toUpperCase() }
        });
        if (!key) {
            console.log(`[LICENSE] Key not found in DB: '${licenseKey}'`);
            const allKeys = await prisma.userLicenseKey.findMany({ select: { licenseKey: true } });
            console.log(`[LICENSE] Valid keys in DB: ${allKeys.map(k => k.licenseKey).join(', ')}`);
            return res.status(404).json({ error: 'Invalid license key' });
        }
        console.log(`[LICENSE] Key found: ${JSON.stringify(key)} `);
        if (key.isUsed) {
            if ((key.serverFingerprint && key.serverFingerprint === serverFingerprint) ||
                key.serverFingerprint === 'CONNECTION-FAILED' ||
                key.serverFingerprint === 'UNKNOWN' ||
                key.serverFingerprint === 'SERVER-OFFLINE-RETRY') {
                console.log(`[LICENSE] Allowing re-activation for key ${licenseKey} (Repairing fingerprint)`);
            }
            else {
                return res.status(400).json({
                    error: 'License key has already been used on another server',
                    usedBy: key.usedByEmail,
                    usedAt: key.usedAt
                });
            }
        }
        if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
            return res.status(400).json({
                error: 'License key has expired',
                expiredAt: key.expiresAt
            });
        }
        if (userId) {
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });
            if (user?.licenseActivated) {
                return res.status(400).json({
                    error: 'You already have an active license',
                    licenseType: user.licenseType,
                    activatedAt: user.licenseActivatedAt
                });
            }
        }
        const databaseOperations = [];
        databaseOperations.push(prisma.userLicenseKey.update({
            where: { id: key.id },
            data: {
                isUsed: true,
                usedBy: userId || 'SYSTEM_INSTALLER',
                usedByEmail: userEmail || 'system@localhost',
                usedAt: new Date(),
                serverFingerprint: serverFingerprint || 'UNKNOWN',
                domain: domain || 'UNKNOWN'
            }
        }));
        if (userId) {
            databaseOperations.push(prisma.user.update({
                where: { id: userId },
                data: {
                    licenseActivated: true,
                    licenseKey: licenseKey.trim().toUpperCase(),
                    licenseType: 'ACTIVATED',
                    licenseActivatedAt: new Date()
                }
            }));
            databaseOperations.push(prisma.subscription.upsert({
                where: { merchantId: userId },
                create: {
                    merchantId: userId,
                    plan: 'ENTERPRISE',
                    status: 'ACTIVE',
                    features: JSON.stringify(['all']),
                    isEnterprise: true,
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                },
                update: {
                    plan: 'ENTERPRISE',
                    status: 'ACTIVE',
                    features: JSON.stringify(['all']),
                    isEnterprise: true,
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                }
            }));
        }
        await prisma.$transaction(databaseOperations);
        res.json({
            success: true,
            message: 'License activated successfully! You now have Enterprise access.',
            license: {
                type: 'ACTIVATED',
                plan: key.planType,
                activatedAt: new Date()
            }
        });
    }
    catch (error) {
        console.error('Activate license key error:', error);
        res.status(500).json({
            error: 'Failed to activate license',
            details: error.message
        });
    }
};
exports.activateUserLicenseKey = activateUserLicenseKey;
const purchaseEnterprisePlan = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (user?.licenseActivated) {
            return res.status(400).json({
                error: 'You already have an active license',
                licenseType: user.licenseType
            });
        }
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: {
                    licenseActivated: true,
                    licenseType: 'PURCHASED',
                    licenseActivatedAt: new Date()
                }
            }),
            prisma.subscription.upsert({
                where: { merchantId: userId },
                create: {
                    merchantId: userId,
                    plan: 'ENTERPRISE',
                    status: 'ACTIVE',
                    features: JSON.stringify(['all']),
                    isEnterprise: true,
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                },
                update: {
                    plan: 'ENTERPRISE',
                    status: 'ACTIVE',
                    features: JSON.stringify(['all']),
                    isEnterprise: true,
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                }
            })
        ]);
        res.json({
            success: true,
            message: 'Enterprise plan activated successfully!',
            license: {
                type: 'PURCHASED',
                plan: 'ENTERPRISE',
                activatedAt: new Date()
            }
        });
    }
    catch (error) {
        console.error('Purchase Enterprise error:', error);
        res.status(500).json({
            error: 'Failed to activate Enterprise plan',
            details: error.message
        });
    }
};
exports.purchaseEnterprisePlan = purchaseEnterprisePlan;
const deleteUserLicenseKey = async (req, res) => {
    try {
        const { keyId } = req.params;
        await prisma.userLicenseKey.delete({
            where: { id: keyId }
        });
        res.json({
            success: true,
            message: 'License key deleted'
        });
    }
    catch (error) {
        console.error('Delete license key error:', error);
        res.status(500).json({
            error: 'Failed to delete license key',
            details: error.message
        });
    }
};
exports.deleteUserLicenseKey = deleteUserLicenseKey;
//# sourceMappingURL=user-license.controller.js.map