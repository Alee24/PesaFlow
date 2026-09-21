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
        if (payload.isTeamMember) {
            const teamMember = await prisma.teamMember.findUnique({
                where: { id: payload.teamMemberId },
                include: { merchant: true }
            });
            if (!teamMember) {
                res.status(401).json({ error: 'Staff member does not exist' });
                return;
            }
            if (teamMember.status !== 'ACTIVE') {
                res.status(403).json({ error: 'Staff account is inactive' });
                return;
            }
            if (teamMember.merchant.status === 'SUSPENDED' || teamMember.merchant.status === 'REJECTED') {
                res.status(403).json({ error: 'Merchant account is suspended' });
                return;
            }
            req.user = {
                userId: teamMember.id,
                merchantId: teamMember.merchantId,
                role: teamMember.role,
                status: teamMember.status,
                isTeamMember: true
            };
            next();
            return;
        }
        if (!payload || (!payload.userId && !payload.teamMemberId)) {
            res.status(401).json({ error: 'Invalid session structure. Please sign in again.' });
            return;
        }
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
            res.status(401).json({ error: 'User account not found. Please sign in again.' });
            return;
        }
        if (user.status === 'REJECTED' || user.status === 'SUSPENDED') {
            res.status(403).json({ error: `Account ${user.status}. Please contact support.` });
            return;
        }
        const merchantId = user.parentId || user.id;
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
        if (err.name === 'TokenExpiredError') {
            res.status(401).json({ error: 'Your session has expired. Please sign in again to continue.' });
            return;
        }
        if (err.name === 'JsonWebTokenError') {
            res.status(401).json({ error: 'Invalid authentication session. Please sign in again.' });
            return;
        }
        console.error('[Auth Middleware Unexpected Error]:', err);
        res.status(500).json({ error: 'Authentication service temporarily unavailable. Please try again.' });
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
    const isSuspendedOrRejected = req.user?.status === 'SUSPENDED' || req.user?.status === 'REJECTED';
    if (isSuspendedOrRejected && req.user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Your account is suspended or rejected.' });
        return;
    }
    next();
};
exports.requireActive = requireActive;
//# sourceMappingURL=auth.middleware.js.map