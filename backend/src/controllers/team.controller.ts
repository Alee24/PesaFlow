import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const prisma = new PrismaClient();

const createBranchManagerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phoneNumber: z.string().min(10),
    password: z.string().min(6)
});

const updateBranchManagerSchema = z.object({
    name: z.string().min(2).optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED']).optional()
});

// Get all branch managers for the main merchant
export const getTeamMembers = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const merchantId = (req as any).user.merchantId;

        // Only main merchant can view branches
        if (userId !== merchantId) {
            return res.status(403).json({ error: 'Only the account owner can view branch managers' });
        }

        const branchManagers = await prisma.user.findMany({
            where: { parentId: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                role: true,
                status: true,
                pin: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(branchManagers);
    } catch (error) {
        console.error("Get Branch Managers Error:", error);
        res.status(500).json({ error: 'Failed to fetch branch managers' });
    }
};

// Create a new branch manager
export const createTeamMember = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const merchantId = (req as any).user.merchantId;

        if (userId !== merchantId) {
            return res.status(403).json({ error: 'Only the account owner can add branch managers' });
        }

        // Check subscription (PRO or ENTERPRISE required)
        const subscription = await prisma.subscription.findUnique({
            where: { merchantId: userId }
        });

        if (!subscription || !['PRO', 'ENTERPRISE'].includes(subscription.plan)) {
            return res.status(403).json({ error: 'Upgrade to PRO plan to add branch managers' });
        }

        const data = createBranchManagerSchema.parse(req.body);

        // Check if email already exists
        const existing = await prisma.user.findFirst({
            where: { email: data.email }
        });

        if (existing) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Check if phone already exists
        const existingPhone = await prisma.user.findFirst({
            where: { phoneNumber: data.phoneNumber }
        });

        if (existingPhone) {
            return res.status(400).json({ error: 'User with this phone number already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(data.password, 10);

        // Create branch manager user
        const branchManager = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                phoneNumber: data.phoneNumber,
                passwordHash,
                role: 'BRANCH_MANAGER',
                status: 'ACTIVE',
                parentId: userId,
                pin: req.body.pin ? await require('bcryptjs').hash(req.body.pin, 10) : null
            },
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

        // Create wallet for branch manager
        await prisma.wallet.create({
            data: {
                userId: branchManager.id,
                balance: 0,
                currency: 'KES'
            }
        });

        res.status(201).json(branchManager);

    } catch (error: any) {
        console.error("Create Branch Manager Error:", error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.issues });
        }
        res.status(500).json({ error: error.message || 'Failed to create branch manager' });
    }
};

// Update branch manager
export const updateTeamMember = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const merchantId = (req as any).user.merchantId;
        const { id } = req.params;

        if (userId !== merchantId) {
            return res.status(403).json({ error: 'Only the account owner can update branch managers' });
        }

        const data = updateBranchManagerSchema.parse(req.body);

        // Verify ownership
        const branchManager = await prisma.user.findFirst({
            where: { id, parentId: userId }
        });

        if (!branchManager) {
            return res.status(404).json({ error: 'Branch manager not found' });
        }

        const updated = await prisma.user.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.status && { status: data.status })
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

        res.json(updated);

    } catch (error: any) {
        console.error("Update Branch Manager Error:", error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.issues });
        }
        res.status(500).json({ error: error.message || 'Failed to update branch manager' });
    }
};

// Suspend branch manager
export const deleteTeamMember = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const merchantId = (req as any).user.merchantId;
        const { id } = req.params;

        if (userId !== merchantId) {
            return res.status(403).json({ error: 'Only the account owner can suspend branch managers' });
        }

        // Verify ownership
        const branchManager = await prisma.user.findFirst({
            where: { id, parentId: userId }
        });

        if (!branchManager) {
            return res.status(404).json({ error: 'Branch manager not found' });
        }

        // Suspend instead of delete
        await prisma.user.update({
            where: { id },
            data: { status: 'SUSPENDED' }
        });

        res.json({ message: 'Branch manager suspended successfully' });

    } catch (error) {
        console.error("Suspend Branch Manager Error:", error);
        res.status(500).json({ error: 'Failed to suspend branch manager' });
    }
};

// Update member PIN
export const updateTeamMemberPin = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const merchantId = (req as any).user.merchantId;
        const { id } = req.params;
        const { pin } = req.body;

        if (userId !== merchantId) {
            return res.status(403).json({ error: 'Only the account owner can update PINs' });
        }

        if (!pin || pin.length !== 4) {
            return res.status(400).json({ error: 'PIN must be 4 digits' });
        }

        // Verify ownership
        const branchManager = await prisma.user.findFirst({
            where: { id, parentId: userId }
        });

        if (!branchManager) {
            return res.status(404).json({ error: 'Team member not found' });
        }

        const hashedPin = await require('bcryptjs').hash(pin, 10);
        await prisma.user.update({
            where: { id },
            data: { pin: hashedPin }
        });

        res.json({ message: 'PIN updated successfully' });

    } catch (error) {
        console.error("Update PIN Error:", error);
        res.status(500).json({ error: 'Failed to update PIN' });
    }
};
