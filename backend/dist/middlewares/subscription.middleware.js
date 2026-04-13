"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FEATURE_ACCESS = exports.checkBranchLimit = exports.incrementTransactionCount = exports.checkTransactionLimit = exports.requireFeature = void 0;
exports.getMinimumPlan = getMinimumPlan;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const FEATURE_ACCESS = {
    'invoices': {
        FREE: false,
        BASIC: true,
        PRO: true,
        ENTERPRISE: true
    },
    'withdrawals': {
        FREE: false,
        BASIC: false,
        PRO: true,
        ENTERPRISE: true
    },
    'team': {
        FREE: false,
        BASIC: false,
        PRO: true,
        ENTERPRISE: true
    },
    'analytics': {
        FREE: false,
        BASIC: false,
        PRO: true,
        ENTERPRISE: true
    },
    'reports': {
        FREE: false,
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
        FREE: false,
        BASIC: false,
        PRO: true,
        ENTERPRISE: true
    }
};
exports.FEATURE_ACCESS = FEATURE_ACCESS;
function getMinimumPlan(feature) {
    const access = FEATURE_ACCESS[feature];
    if (!access)
        return 'PRO';
    if (access.BASIC)
        return 'BASIC';
    if (access.PRO)
        return 'PRO';
    return 'ENTERPRISE';
}
const requireFeature = (feature) => {
    return async (req, res, next) => {
        try {
            const merchantId = req.user?.merchantId;
            const userRole = req.user?.role;
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
            if (!subscription) {
                await prisma.subscription.create({
                    data: {
                        merchantId,
                        plan: 'FREE',
                        status: 'ACTIVE',
                        features: '[]'
                    }
                });
                if (!FEATURE_ACCESS[feature]?.FREE) {
                    res.status(403).json({
                        error: `This feature requires ${getMinimumPlan(feature)} plan`,
                        currentPlan: 'FREE',
                        requiredPlan: getMinimumPlan(feature),
                        upgrade: true
                    });
                    return;
                }
            }
            else {
                if (subscription.status !== 'ACTIVE') {
                    res.status(403).json({
                        error: 'Active subscription required',
                        currentPlan: subscription.plan,
                        status: subscription.status,
                        upgrade: true
                    });
                    return;
                }
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
        }
        catch (error) {
            console.error('Feature check error:', error);
            res.status(500).json({ error: 'Failed to verify feature access' });
        }
    };
};
exports.requireFeature = requireFeature;
const checkTransactionLimit = async (req, res, next) => {
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
            await prisma.subscription.create({
                data: { merchantId, plan: 'FREE', status: 'ACTIVE', features: '[]' }
            });
            next();
            return;
        }
        if (subscription.plan === 'BASIC') {
            const now = new Date();
            const resetDate = new Date(subscription.txCountResetDate);
            if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
                await prisma.subscription.update({
                    where: { merchantId },
                    data: {
                        monthlyTxCount: 0,
                        txCountResetDate: now
                    }
                });
            }
            else if (subscription.monthlyTxCount >= 100) {
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
    }
    catch (error) {
        console.error('Transaction limit check error:', error);
        res.status(500).json({ error: 'Failed to verify transaction limit' });
    }
};
exports.checkTransactionLimit = checkTransactionLimit;
const incrementTransactionCount = async (merchantId) => {
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
    }
    catch (error) {
        console.error('Failed to increment transaction count:', error);
    }
};
exports.incrementTransactionCount = incrementTransactionCount;
const checkBranchLimit = async (req, res, next) => {
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
    }
    catch (error) {
        console.error('Branch limit check error:', error);
        res.status(500).json({ error: 'Failed to verify branch limit' });
    }
};
exports.checkBranchLimit = checkBranchLimit;
//# sourceMappingURL=subscription.middleware.js.map
