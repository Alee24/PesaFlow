import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        merchantId: string; // Same as userId for main merchants
        role: string;
        status: string;
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

        req.user = {
            userId: user.id,
            merchantId: user.id, // Team members share the merchant's account
            role: user.role,
            status: user.status
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
