import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        merchantId: string; // Main merchant ID (for branch managers, this is parentId)
        role: string;
        status: string;
        parentId?: string;
    };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;

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

        // Block rejected or suspended users
        if (user.status === 'REJECTED' || user.status === 'SUSPENDED') {
            res.status(403).json({ error: `Account ${user.status}. Please contact support.` });
            return;
        }

        // Branch Manager: merchantId is the parent (main merchant)
        const merchantId = user.parentId || user.id;

        // Check parent subscription for branch managers
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
        }

        req.user = {
            userId: user.id,
            merchantId,
            role: user.role,
            status: user.status,
            parentId: user.parentId || undefined
        };

        next();

    } catch (err) {
        res.status(403).json({ error: 'Invalid or expired token' });
        return;
    }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }
    next();
};

export const requireActive = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user?.status !== 'ACTIVE' && req.user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Full account activation required for this feature.' });
        return;
    }
    next();
};
