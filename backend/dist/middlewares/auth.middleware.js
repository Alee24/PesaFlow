"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireActive = exports.requireAdmin = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                role: true,
                status: true,
                parentId: true,
                email: true
            }
        });
        if (!user) {
            res.status(401).json({ error: 'User does not exist' });
            return;
        }
        if (user.status === 'REJECTED' || user.status === 'SUSPENDED') {
            res.status(403).json({ error: `Account ${user.status}. Please contact support.` });
            return;
        }
        const merchantId = user.parentId || user.id;
        if (user.parentId) {
            const parentSubscription = await prisma.subscription.findUnique({
                where: { merchantId: merchantId }
            });
            if (!parentSubscription || parentSubscription.status !== 'ACTIVE') {
                res.status(403).json({
                    error: 'Main merchant subscription required. Please contact your account owner.',
                    requiresUpgrade: true
                });
                return;
            }
            if (parentSubscription.plan !== 'PRO' && parentSubscription.plan !== 'ENTERPRISE') {
                res.status(403).json({
                    error: 'Branch manager access requires PRO or ENTERPRISE plan. Please contact your account owner.',
                    currentPlan: parentSubscription.plan,
                    requiredPlan: 'PRO',
                    requiresUpgrade: true
                });
                return;
            }
        }
        req.user = {
            userId: user.id,
            merchantId,
            role: user.role,
            status: user.status,
            parentId: user.parentId || undefined
        };
        next();
    }
    catch (err) {
        res.status(403).json({ error: 'Invalid or expired token' });
        return;
    }
};
exports.authenticateToken = authenticateToken;
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireActive = (req, res, next) => {
    if (req.user?.status !== 'ACTIVE' && req.user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Full account activation required for this feature.' });
        return;
    }
    next();
};
exports.requireActive = requireActive;
//# sourceMappingURL=auth.middleware.js.map