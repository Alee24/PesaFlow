import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        merchantId: string; // The owner of the data (could be self or parent)
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

        // Fetch fresh user data from DB to ensure validity and current hierarchy
        // This fixes issues where 'parentId' might be missing from legacy tokens
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
            return res.status(401).json({ error: 'User does not exist' });
        }

        // Broad guard: REJECTED or SUSPENDED users are blocked entirely
        if (user.status === 'REJECTED' || user.status === 'SUSPENDED') {
            return res.status(403).json({ error: `Account ${user.status}. Please contact support.` });
        }

        // Team Logic:
        // If user has a parentId, they are a sub-user.
        // Their 'merchantId' (scope) is the parent.
        const merchantId = user.parentId || user.id;

        req.user = {
            userId: user.id,
            merchantId,
            role: user.role,
            status: user.status,
            parentId: user.parentId || undefined
        };

        next();

    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
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
