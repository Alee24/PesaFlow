import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();

const verifyPinSchema = z.object({
    teamMemberId: z.string().uuid(),
    pin: z.string().min(4).max(6)
});

// GET /api/pos/auth/staff
// Returns list of staff for the currently authenticated MERCHANT (who authorized the device)
export const getStaffList = async (req: Request, res: Response): Promise<void> => {
    try {
        const merchantId = (req as any).user.userId;

        // Ensure the requester is actually a merchant/admin, not another staff member
        // (Though technically a manager staff could authorize a device too, let's restrict to Merchant/Admin for now)
        // Actually, let's just use the merchantId from the token.

        const staff = await prisma.teamMember.findMany({
            where: {
                merchantId: merchantId,
                status: 'ACTIVE'
            },
            select: {
                id: true,
                name: true,
                role: true,
                // NEVER return the PIN
            }
        });

        res.json(staff);
    } catch (error) {
        console.error("Get Staff List Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// POST /api/pos/auth/verify-pin
// Authenticates a staff member via PIN and returns a limited-scope Token
export const verifyPin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { teamMemberId, pin } = verifyPinSchema.parse(req.body);

        const staff = await prisma.teamMember.findUnique({
            where: { id: teamMemberId },
            include: { merchant: true }
        });

        if (!staff) {
            res.status(404).json({ error: 'Staff member not found' });
            return;
        }

        if (staff.status !== 'ACTIVE') {
            res.status(403).json({ error: 'Account suspended' });
            return;
        }

        if (!staff.pin) {
            res.status(400).json({ error: 'PIN not set for this user' });
            return;
        }

        const isValid = await bcrypt.compare(pin, staff.pin);

        if (!isValid) {
            res.status(401).json({ error: 'Invalid PIN' });
            return;
        }

        // Generate Team Member Token
        const token = jwt.sign(
            {
                teamMemberId: staff.id,
                merchantId: staff.merchantId,
                role: staff.role,
                isTeamMember: true
            },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '12h' } // POS shifts are usually < 12h
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: staff.id,
                name: staff.name,
                role: staff.role,
                merchantId: staff.merchantId,
                isTeamMember: true
            }
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid data format' });
        } else {
            console.error("Verify PIN Error:", error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};
