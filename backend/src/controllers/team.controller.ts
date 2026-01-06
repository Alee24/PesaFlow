import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const prisma = new PrismaClient();

const createUserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    phoneNumber: z.string().min(10)
});

// Get Team Members
export const getTeamMembers = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const merchantId = (req as any).user.merchantId;

        // Ensure only the MAIN merchant can view/manage team
        if (userId !== merchantId) {
            return res.status(403).json({ error: 'Only the account owner can manage team members' });
        }

        const team = await prisma.user.findMany({
            where: { parentId: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                role: true,
                status: true,
                createdAt: true
            }
        });

        res.json(team);
    } catch (error) {
        console.error("Get Team Error:", error);
        res.status(500).json({ error: 'Failed to fetch team members' });
    }
};

// Create Team Member
export const createTeamMember = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const merchantId = (req as any).user.merchantId;

        if (userId !== merchantId) {
            return res.status(403).json({ error: 'Only the account owner can manage team members' });
        }

        // Check Subscription (Must be PRO or ENTERPRISE)
        const subscription = await prisma.subscription.findUnique({
            where: { merchantId: userId }
        });

        if (!subscription || (subscription.plan !== 'PRO' && subscription.plan !== 'ENTERPRISE')) {
            return res.status(403).json({ error: 'Upgrade to PRO plan to add team members' });
        }

        // Enforce limits? e.g. PRO = 3 users, ENTERPRISE = Unlimited.
        // For now, infinite.

        const data = createUserSchema.parse(req.body);

        // Check existing
        const existing = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: data.email },
                    { phoneNumber: data.phoneNumber }
                ]
            }
        });

        if (existing) {
            return res.status(400).json({ error: 'User with this email or phone already exists' });
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const newUser = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                phoneNumber: data.phoneNumber,
                passwordHash: hashedPassword,
                role: 'MERCHANT', // They are merchants, but sub-users
                status: 'ACTIVE', // Auto-active for now, or PENDING?
                parentId: userId
            },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                role: true,
                status: true
            }
        });

        res.status(201).json(newUser);

    } catch (error: any) {
        console.error("Create Team Member Error:", error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: (error as any).errors });
        }
        // Return actual error message for debugging (in dev/beta)
        res.status(500).json({ error: 'Failed to create team member: ' + (error.message || 'Unknown error') });
    }
};

// Delete/Suspend Team Member
export const deleteTeamMember = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const merchantId = (req as any).user.merchantId;
        const { id } = req.params;

        if (userId !== merchantId) {
            return res.status(403).json({ error: 'Only the account owner can manage team members' });
        }

        // Check ownership
        const member = await prisma.user.findFirst({
            where: { id, parentId: userId }
        });

        if (!member) {
            return res.status(404).json({ error: 'Team member not found' });
        }

        // We probably shouldn't DELETE, but SUSPEND or set status to ARCHIVED
        // But deleting might be requested.
        // Safe delete:
        await prisma.user.update({
            where: { id },
            data: { status: 'SUSPENDED' } // or DELETE if you want hard delete
        });

        // hard delete if no relations? safer to suspend.
        // If we really want to delete:
        // await prisma.user.delete({ where: { id } });

        res.json({ message: 'Team member suspended successfully' });

    } catch (error) {
        console.error("Delete Team Member Error:", error);
        res.status(500).json({ error: 'Failed to remove team member' });
    }
};
