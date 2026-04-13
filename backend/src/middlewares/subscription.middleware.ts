import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from './auth.middleware';

const prisma = new PrismaClient();

// Feature access matrix - EVERYTHING IS NOW 100% FREE
const FEATURE_ACCESS: Record<string, Record<string, boolean>> = {
    'invoices': {
        FREE: true,
        BASIC: true,
        PRO: true,
        ENTERPRISE: true
    },
    'withdrawals': {
        FREE: true,
        BASIC: true,
        PRO: true,
        ENTERPRISE: true
    },
    'team': {
        FREE: true,
        BASIC: true,
        PRO: true,
        ENTERPRISE: true
    },
    'analytics': {
        FREE: true,
        BASIC: true,
        PRO: true,
        ENTERPRISE: true
    },
    'reports': {
        FREE: true,
        BASIC: true,
        PRO: true,
        ENTERPRISE: true
    },
    'CRM': {
        FREE: true,
        BASIC: true,
        PRO: true,
        ENTERPRISE: true
    },
    'ADVANCED_CRM': {
        FREE: true,
        BASIC: true,
        PRO: true,
        ENTERPRISE: true
    }
};

// Get minimum plan required for a feature
function getMinimumPlan(feature: string): string {
    return 'FREE'; // Everything is free
}

// Middleware to check if user has access to a feature
export const requireFeature = (feature: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const merchantId = req.user?.merchantId;
            const userRole = req.user?.role;

            // ADMIN users have access to all features
            if (userRole === 'ADMIN') {
                next();
                return;
            }

            if (!merchantId) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }

            const subscription = await prisma.subscription.findUnique({
                where: { merchantId }
            });

            // If no subscription, create FREE tier with 1-year end date
            if (!subscription) {
                const oneYearFromNow = new Date();
                oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

                await prisma.subscription.create({
                    data: {
                        merchantId,
                        plan: 'FREE',
                        status: 'ACTIVE',
                        features: '[]',
                        endDate: oneYearFromNow
                    }
                });

                // Check if FREE has access
                if (!FEATURE_ACCESS[feature]?.FREE) {
                    res.status(403).json({
                        error: `This feature requires ${getMinimumPlan(feature)} plan`,
                        currentPlan: 'FREE',
                        requiredPlan: getMinimumPlan(feature),
                        upgrade: true
                    });
                    return;
                }
            } else {
                // Check subscription status
                if (subscription.status !== 'ACTIVE') {
                    res.status(403).json({
                        error: 'Active subscription required',
                        currentPlan: subscription.plan,
                        status: subscription.status,
                        upgrade: true
                    });
                    return;
                }

                /* 
                // Skip Expiry Check for 100% Free Version
                if (subscription.endDate && new Date(subscription.endDate) < new Date()) {
                    res.status(403).json({
                        error: 'Your free access for one year has expired. Please upgrade to continue.',
                        currentPlan: subscription.plan,
                        expired: true,
                        endDate: subscription.endDate,
                        upgrade: true
                    });
                    return;
                }
                */

                // Check feature access
                const plan = subscription.plan;
                const hasAccess = FEATURE_ACCESS[feature]?.[plan];

                if (!hasAccess) {
                    res.status(403).json({
                        error: `This feature requires ${getMinimumPlan(feature)} plan`,
                        currentPlan: plan,
                        requiredPlan: getMinimumPlan(feature),
                        upgrade: true
                    });
                    return;
                }
            }

            next();
        } catch (error) {
            console.error('Feature check error:', error);
            res.status(500).json({ error: 'Failed to verify feature access' });
        }
    };
};

// Middleware to check transaction limits (BASIC tier only)
export const checkTransactionLimit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const merchantId = req.user?.merchantId;

        if (!merchantId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const subscription = await prisma.subscription.findUnique({
            where: { merchantId }
        });

        if (!subscription) {
            // Create FREE subscription with one year expiry
            const oneYearFromNow = new Date();
            oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
            
            await prisma.subscription.create({
                data: { merchantId, plan: 'FREE', status: 'ACTIVE', features: '[]', endDate: oneYearFromNow }
            });
            next();
            return;
        }

        // Only BASIC tier has transaction limits
        if (subscription.plan === 'BASIC') {
            const now = new Date();
            const resetDate = new Date(subscription.txCountResetDate);

            // Check if month has changed (reset counter)
            if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
                await prisma.subscription.update({
                    where: { merchantId },
                    data: {
                        monthlyTxCount: 0,
                        txCountResetDate: now
                    }
                });
            } else if (subscription.monthlyTxCount >= 100) {
                // Limit reached
                res.status(403).json({
                    error: 'Monthly transaction limit reached (100/100)',
                    currentPlan: 'BASIC',
                    requiredPlan: 'PRO',
                    upgrade: true,
                    limit: 100,
                    used: subscription.monthlyTxCount
                });
                return;
            }
        }

        next();
    } catch (error) {
        console.error('Transaction limit check error:', error);
        res.status(500).json({ error: 'Failed to verify transaction limit' });
    }
};

// Middleware to increment transaction counter after successful sale
export const incrementTransactionCount = async (merchantId: string): Promise<void> => {
    try {
        const subscription = await prisma.subscription.findUnique({
            where: { merchantId }
        });

        if (subscription && subscription.plan === 'BASIC') {
            await prisma.subscription.update({
                where: { merchantId },
                data: {
                    monthlyTxCount: { increment: 1 }
                }
            });
        }
    } catch (error) {
        console.error('Failed to increment transaction count:', error);
    }
};

// Check branch limit
export const checkBranchLimit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const merchantId = req.user?.merchantId;
        const userId = req.user?.userId;

        if (!merchantId || merchantId !== userId) {
            res.status(403).json({ error: 'Only main merchant can create branches' });
            return;
        }

        const subscription = await prisma.subscription.findUnique({
            where: { merchantId }
        });

        if (!subscription || subscription.plan === 'FREE' || subscription.plan === 'BASIC') {
            res.status(403).json({
                error: 'Branch management requires PRO plan',
                currentPlan: subscription?.plan || 'FREE',
                requiredPlan: 'PRO',
                upgrade: true
            });
            return;
        }

        // Check branch count for PRO (max 10)
        if (subscription.plan === 'PRO') {
            const branchCount = await prisma.user.count({
                where: { parentId: merchantId }
            });

            if (branchCount >= 10) {
                res.status(403).json({
                    error: 'Branch limit reached (10/10 for PRO plan)',
                    currentPlan: 'PRO',
                    requiredPlan: 'ENTERPRISE',
                    upgrade: true
                });
                return;
            }
        }

        next();
    } catch (error) {
        console.error('Branch limit check error:', error);
        res.status(500).json({ error: 'Failed to verify branch limit' });
    }
};

export { FEATURE_ACCESS, getMinimumPlan };
