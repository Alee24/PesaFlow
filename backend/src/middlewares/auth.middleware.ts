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

        // CHECK FOR TEAM MEMBER TOKEN
        if (payload.isTeamMember) {
            const teamMember = await prisma.teamMember.findUnique({
                where: { id: payload.teamMemberId },
                include: { merchant: true } // Include merchant to check status/subscription if needed
            });

            if (!teamMember) {
                res.status(401).json({ error: 'Staff member does not exist' });
                return;
            }

            if (teamMember.status !== 'ACTIVE') {
                res.status(403).json({ error: 'Staff account is inactive' });
                return;
            }

            // Optional: Check Merchant Status
            if (teamMember.merchant.status === 'SUSPENDED' || teamMember.merchant.status === 'REJECTED') {
                res.status(403).json({ error: 'Merchant account is suspended' });
                return;
            }

            req.user = {
                userId: teamMember.id, // Using TeamMember ID as userId for POS contexts
                merchantId: teamMember.merchantId,
                role: teamMember.role, // STAFF, CASHIER, MANAGER
                status: teamMember.status,
                isTeamMember: true
            } as any; // Cast to any to extend the type dynamically

            next();
            return;
        }

        // STANDARD USER TOKEN (Merchants, Admins)
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

        // Parent subscription checks for branch managers bypassed to allow 100% unlocked unlimited access
        if (user.parentId) {
            // Unlocked: Bypassed plan limits on login
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
