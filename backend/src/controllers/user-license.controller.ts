import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}

/**
 * Generate a unique license key
 */
function generateLicenseKey(): string {
    const prefix = 'ENT'; // Enterprise
    const random = crypto.randomBytes(16).toString('hex').toUpperCase();
    const checksum = crypto.createHash('sha256').update(random).digest('hex').substring(0, 4).toUpperCase();

    // Format: ENT-XXXX-XXXX-XXXX-XXXX-XXXX
    const formatted = random.match(/.{1,4}/g)?.join('-') || random;
    return `${prefix}-${formatted}-${checksum}`;
}

/**
 * Admin: Generate license keys
 */
export const generateUserLicenseKeys = async (req: AuthRequest, res: Response) => {
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
    } catch (error: any) {
        console.error('Generate license keys error:', error);
        res.status(500).json({
            error: 'Failed to generate license keys',
            details: error.message
        });
    }
};

/**
 * Admin: Get all license keys
 */
export const getAllUserLicenseKeys = async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.query;

        const where: any = {};
        if (status === 'used') {
            where.isUsed = true;
        } else if (status === 'unused') {
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
    } catch (error: any) {
        console.error('Get license keys error:', error);
        res.status(500).json({
            error: 'Failed to fetch license keys',
            details: error.message
        });
    }
};

/**
 * User: Activate license key
 */
export const activateUserLicenseKey = async (req: AuthRequest, res: Response) => {
    try {
        const { licenseKey } = req.body;
        const userId = req.user?.userId;
        const userEmail = req.user?.email;

        if (!licenseKey) {
            return res.status(400).json({ error: 'License key is required' });
        }

        // Find the license key
        const key = await prisma.userLicenseKey.findUnique({
            where: { licenseKey: licenseKey.trim().toUpperCase() }
        });

        if (!key) {
            return res.status(404).json({ error: 'Invalid license key' });
        }

        // Check if already used
        if (key.isUsed) {
            return res.status(400).json({
                error: 'License key has already been used',
                usedBy: key.usedByEmail,
                usedAt: key.usedAt
            });
        }

        // Check if expired
        if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
            return res.status(400).json({
                error: 'License key has expired',
                expiredAt: key.expiresAt
            });
        }

        // Check if user already has a license
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

        // Activate the license
        await prisma.$transaction([
            // Mark key as used
            prisma.userLicenseKey.update({
                where: { id: key.id },
                data: {
                    isUsed: true,
                    usedBy: userId,
                    usedByEmail: userEmail,
                    usedAt: new Date()
                }
            }),
            // Update user with license
            prisma.user.update({
                where: { id: userId },
                data: {
                    licenseActivated: true,
                    licenseKey: licenseKey.trim().toUpperCase(),
                    licenseType: 'ACTIVATED',
                    licenseActivatedAt: new Date()
                }
            }),
            // Upgrade user subscription to Enterprise
            prisma.subscription.upsert({
                where: { userId },
                create: {
                    userId,
                    plan: 'ENTERPRISE',
                    status: 'ACTIVE',
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
                },
                update: {
                    plan: 'ENTERPRISE',
                    status: 'ACTIVE',
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                }
            })
        ]);

        res.json({
            success: true,
            message: 'License activated successfully! You now have Enterprise access.',
            license: {
                type: 'ACTIVATED',
                plan: key.planType,
                activatedAt: new Date()
            }
        });
    } catch (error: any) {
        console.error('Activate license key error:', error);
        res.status(500).json({
            error: 'Failed to activate license',
            details: error.message
        });
    }
};

/**
 * User: Purchase Enterprise plan (subscribe)
 */
export const purchaseEnterprisePlan = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        // Check if user already has a license
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (user?.licenseActivated) {
            return res.status(400).json({
                error: 'You already have an active license',
                licenseType: user.licenseType
            });
        }

        // Update user and subscription
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
                where: { userId },
                create: {
                    userId,
                    plan: 'ENTERPRISE',
                    status: 'ACTIVE',
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                },
                update: {
                    plan: 'ENTERPRISE',
                    status: 'ACTIVE',
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
    } catch (error: any) {
        console.error('Purchase Enterprise error:', error);
        res.status(500).json({
            error: 'Failed to activate Enterprise plan',
            details: error.message
        });
    }
};

/**
 * Admin: Delete license key
 */
export const deleteUserLicenseKey = async (req: AuthRequest, res: Response) => {
    try {
        const { keyId } = req.params;

        await prisma.userLicenseKey.delete({
            where: { id: keyId }
        });

        res.json({
            success: true,
            message: 'License key deleted'
        });
    } catch (error: any) {
        console.error('Delete license key error:', error);
        res.status(500).json({
            error: 'Failed to delete license key',
            details: error.message
        });
    }
};
