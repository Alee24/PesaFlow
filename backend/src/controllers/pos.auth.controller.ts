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

        // 1. Fetch the merchant themselves (Owner)
        const merchant = await prisma.user.findUnique({
            where: { id: merchantId },
            select: {
                id: true,
                name: true,
                role: true
            }
        });

        // 2. Fetch team members
        const staff = await prisma.teamMember.findMany({
            where: {
                merchantId: merchantId,
                status: 'ACTIVE'
            },
            select: {
                id: true,
                name: true,
                role: true,
            }
        });

        const combinedList = [];
        if (merchant) {
            combinedList.push({
                id: merchant.id,
                name: `${merchant.name || 'Owner'} (Owner)`,
                role: 'MERCHANT',
                isOwner: true
            });
        }
        
        combinedList.push(...staff);

        res.json(combinedList);
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

        let user: { id: string, name: string | null, role: string, pin: string | null, merchantId: string };

        const staff = await prisma.teamMember.findUnique({
            where: { id: teamMemberId }
        });

        if (staff) {
            user = {
                id: staff.id,
                name: staff.name,
                role: staff.role,
                pin: staff.pin,
                merchantId: staff.merchantId
            };
        } else {
            // Try looking in User table (Merchant themselves)
            const merchant = await prisma.user.findUnique({
                where: { id: teamMemberId }
            });

            if (merchant) {
                user = {
                    id: merchant.id,
                    name: merchant.name,
                    role: merchant.role,
                    pin: (merchant as any).pin, // we added this recently
                    merchantId: merchant.id
                };
            } else {
                res.status(404).json({ error: 'Person not found' });
                return;
            }
        }

        if (!user.pin) {
            res.status(400).json({ error: 'PIN not set for this person' });
            return;
        }

        const isValid = await bcrypt.compare(pin, user.pin);

        if (!isValid) {
            res.status(401).json({ error: 'Invalid PIN' });
            return;
        }

        // Generate Team Member Token
        const token = jwt.sign(
            {
                teamMemberId: user.id,
                merchantId: user.merchantId,
                role: user.role,
                isTeamMember: true
            },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '12h' }
        );


        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                merchantId: user.merchantId,
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
