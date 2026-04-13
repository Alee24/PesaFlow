"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLicenseStatus = exports.activateLicense = exports.requireValidLicense = exports.checkLicense = exports.generateServerFingerprint = void 0;
const crypto_1 = __importDefault(require("crypto"));
const os_1 = __importDefault(require("os"));
const client_1 = require("@prisma/client");
const master_license_1 = require("../utils/master-license");
const prisma = new client_1.PrismaClient();
const ENCRYPTION_KEY = process.env.LICENSE_ENCRYPTION_KEY || 'your-32-character-secret-key-here';
const MASTER_LICENSE_SERVER = process.env.MASTER_LICENSE_SERVER || 'https://license.mpesaconnect.co.ke';
const generateServerFingerprint = () => {
    const networkInterfaces = os_1.default.networkInterfaces();
    const cpus = os_1.default.cpus();
    const identifiers = [
        os_1.default.hostname(),
        os_1.default.platform(),
        os_1.default.arch(),
        cpus[0]?.model || '',
        Object.values(networkInterfaces)
            .flat()
            .filter(iface => iface && !iface.internal && iface.mac !== '00:00:00:00:00:00')
            .map(iface => iface?.mac)
            .join('-')
    ];
    return crypto_1.default
        .createHash('sha256')
        .update(identifiers.join('|'))
        .digest('hex');
};
exports.generateServerFingerprint = generateServerFingerprint;
const encryptLicense = (data) => {
    const iv = crypto_1.default.randomBytes(16);
    const key = crypto_1.default.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto_1.default.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
};
const decryptLicense = (encryptedData) => {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const key = crypto_1.default.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
const validateWithMasterServer = async (domain, fingerprint) => {
    try {
        const response = await fetch(`${MASTER_LICENSE_SERVER}/api/license/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': process.env.MASTER_LICENSE_KEY || ''
            },
            body: JSON.stringify({ domain, fingerprint })
        });
        if (!response.ok)
            return false;
        const data = await response.json();
        return data.valid === true;
    }
    catch (error) {
        console.error('Master server validation failed:', error);
        return false;
    }
};
const checkLicense = async () => {
    try {
        const currentFingerprint = (0, exports.generateServerFingerprint)();
        const currentDomain = process.env.DOMAIN || 'localhost';
        const masterKey = process.env.MASTER_LICENSE_KEY_INSTALLED;
        if (masterKey) {
            const masterValidation = (0, master_license_1.validateMasterLicense)(masterKey);
            if (masterValidation.valid && masterValidation.data) {
                return {
                    valid: true,
                    license: {
                        domain: currentDomain,
                        serverFingerprint: currentFingerprint,
                        activatedAt: new Date(masterValidation.data.issuedAt),
                        expiresAt: new Date(masterValidation.data.expiresAt),
                        maxUsers: masterValidation.data.maxInstallations,
                        features: masterValidation.data.features,
                        status: 'ACTIVE'
                    }
                };
            }
        }
        const userLicense = await prisma.userLicenseKey.findFirst({
            where: {
                isUsed: true
            }
        });
        console.log(`[LICENSE_CHECK] Fingerprint: ${currentFingerprint} | Found User License: ${!!userLicense}`);
        if (!userLicense) {
            const anyKey = await prisma.userLicenseKey.findFirst({ where: { isUsed: true } });
            if (anyKey) {
                console.log(`[LICENSE_CHECK] MISMATCH! Key exists for fingerprint: ${anyKey.serverFingerprint}`);
            }
        }
        if (userLicense) {
            if (userLicense.expiresAt && new Date(userLicense.expiresAt) < new Date()) {
                return {
                    valid: false,
                    error: 'USER_LICENSE_EXPIRED'
                };
            }
            return {
                valid: true,
                license: {
                    domain: currentDomain,
                    serverFingerprint: currentFingerprint,
                    activatedAt: userLicense.usedAt || new Date(),
                    expiresAt: userLicense.expiresAt || new Date('2099-12-31'),
                    maxUsers: 999,
                    features: ['all'],
                    status: 'ACTIVE'
                }
            };
        }
        const licenseRecord = await prisma.systemLicense.findFirst({
            where: { domain: currentDomain }
        });
        if (!licenseRecord) {
            return {
                valid: false,
                error: 'NO_LICENSE_FOUND'
            };
        }
        let licenseData;
        try {
            const decrypted = decryptLicense(licenseRecord.licenseKey);
            licenseData = JSON.parse(decrypted);
        }
        catch (error) {
            return {
                valid: false,
                error: 'INVALID_LICENSE_FORMAT'
            };
        }
        if (licenseData.serverFingerprint !== currentFingerprint) {
            return {
                valid: false,
                error: 'SERVER_MISMATCH'
            };
        }
        if (licenseData.domain !== currentDomain) {
            return {
                valid: false,
                error: 'DOMAIN_MISMATCH'
            };
        }
        if (new Date(licenseData.expiresAt) < new Date()) {
            return {
                valid: false,
                error: 'LICENSE_EXPIRED'
            };
        }
        if (licenseData.status !== 'ACTIVE') {
            return {
                valid: false,
                error: 'LICENSE_SUSPENDED'
            };
        }
        const masterValidation = await validateWithMasterServer(currentDomain, currentFingerprint);
        if (!masterValidation) {
            return {
                valid: false,
                error: 'MASTER_SERVER_VALIDATION_FAILED'
            };
        }
        return {
            valid: true,
            license: licenseData
        };
    }
    catch (error) {
        console.error('License check error:', error);
        return {
            valid: false,
            error: 'LICENSE_CHECK_FAILED'
        };
    }
};
exports.checkLicense = checkLicense;
const requireValidLicense = async (req, res, next) => {
    if (process.env.NODE_ENV === 'development' || process.env.BYPASS_LICENSE === 'true') {
        req.license = {
            domain: 'localhost',
            status: 'ACTIVE',
            features: ['all']
        };
        return next();
    }
    const licenseCheck = await (0, exports.checkLicense)();
    if (!licenseCheck.valid) {
        return res.status(403).json({
            error: 'License validation failed',
            code: licenseCheck.error,
            message: getLicenseErrorMessage(licenseCheck.error || 'UNKNOWN'),
            contact: 'Please contact support@mpesaconnect.co.ke to activate your license'
        });
    }
    req.license = licenseCheck.license;
    next();
};
exports.requireValidLicense = requireValidLicense;
const getLicenseErrorMessage = (errorCode) => {
    const messages = {
        'NO_LICENSE_FOUND': 'No license found for this installation. Please contact support to activate.',
        'INVALID_LICENSE_FORMAT': 'License file is corrupted or invalid.',
        'SERVER_MISMATCH': 'This license is not valid for this server. Hardware change detected.',
        'DOMAIN_MISMATCH': 'This license is not valid for this domain.',
        'LICENSE_EXPIRED': 'Your license has expired. Please renew to continue using the application.',
        'LICENSE_SUSPENDED': 'Your license has been suspended. Please contact support.',
        'MASTER_SERVER_VALIDATION_FAILED': 'Unable to validate license with master server.',
        'LICENSE_CHECK_FAILED': 'License validation failed. Please try again or contact support.'
    };
    return messages[errorCode] || 'Unknown license error';
};
const activateLicense = async (req, res) => {
    try {
        const { domain, maxUsers, features, durationDays } = req.body;
        const fingerprint = (0, exports.generateServerFingerprint)();
        const licenseData = {
            domain,
            serverFingerprint: fingerprint,
            activatedAt: new Date(),
            expiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
            maxUsers: maxUsers || 100,
            features: features || ['all'],
            status: 'ACTIVE'
        };
        const encryptedLicense = encryptLicense(JSON.stringify(licenseData));
        await prisma.systemLicense.upsert({
            where: { domain },
            create: {
                domain,
                licenseKey: encryptedLicense,
                fingerprint,
                status: 'ACTIVE',
                expiresAt: licenseData.expiresAt
            },
            update: {
                licenseKey: encryptedLicense,
                fingerprint,
                status: 'ACTIVE',
                expiresAt: licenseData.expiresAt
            }
        });
        res.json({
            success: true,
            message: 'License activated successfully',
            license: {
                domain,
                expiresAt: licenseData.expiresAt,
                maxUsers: licenseData.maxUsers
            }
        });
    }
    catch (error) {
        console.error('License activation error:', error);
        res.status(500).json({
            error: 'Failed to activate license',
            details: error.message
        });
    }
};
exports.activateLicense = activateLicense;
const getLicenseStatus = async (req, res) => {
    const licenseCheck = await (0, exports.checkLicense)();
    if (!licenseCheck.valid) {
        return res.json({
            valid: false,
            error: licenseCheck.error,
            message: getLicenseErrorMessage(licenseCheck.error || 'UNKNOWN')
        });
    }
    res.json({
        valid: true,
        license: {
            domain: licenseCheck.license?.domain,
            expiresAt: licenseCheck.license?.expiresAt,
            maxUsers: licenseCheck.license?.maxUsers,
            features: licenseCheck.license?.features,
            status: licenseCheck.license?.status
        }
    });
};
exports.getLicenseStatus = getLicenseStatus;
//# sourceMappingURL=license.middleware.js.map
