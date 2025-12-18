
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }

    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err: any, user: any) => {
        if (err) {
            res.status(403).json({ error: 'Invalid or expired token' });
            return;
        }

        // Broad guard: REJECTED or SUSPENDED users are blocked entirely
        if (user.status === 'REJECTED' || user.status === 'SUSPENDED') {
            res.status(403).json({ error: `Account ${user.status}. Please contact support.` });
            return;
        }

        req.user = user;
        next();
    });
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
