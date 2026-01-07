import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const prisma = new PrismaClient();

const createTeamMemberSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phoneNumber: z.string().min(10).optional(),
    pin: z.string().length(4).optional(), // 4-digit PIN
    role: z.enum(['STAFF', 'MANAGER', 'CASHIER']).default('STAFF'),
    permissions: z.object({
        canMakeSales: z.boolean().default(true),
        canViewReports: z.boolean().default(false),
        canManageInventory: z.boolean().default(false),
        canProcessWithdrawals: z.boolean().default(false)
    }).optional()
});

const updateTeamMemberSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phoneNumber: z.string().min(10).optional(),
    pin: z.string().length(4).optional(),
    role: z.enum(['STAFF', 'MANAGER', 'CASHIER']).optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
    permissions: z.object({
        canMakeSales: z.boolean(),
        canViewReports: z.boolean(),
        canManageInventory: z.boolean(),
        canProcessWithdrawals: z.boolean()
    }).optional()
});

// Get all team members for the merchant
export const getTeamMembers = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const merchantId = (req as any).user.merchantId;

        // Only main merchant can view team
        if (userId !== merchantId) {
            return res.status(403).json({ error: 'Only the account owner can view team members' });
        }

        const teamMembers = await prisma.teamMember.findMany({
            where: { merchantId: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                role: true,
                status: true,
                permissions: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Parse permissions JSON
        const formattedMembers = teamMembers.map(member => ({
            ...member,
            permissions: member.permissions ? JSON.parse(member.permissions) : null
        }));

        res.json(formattedMembers);
    } catch (error) {
        console.error("Get Team Members Error:", error);
        res.status(500).json({ error: 'Failed to fetch team members' });
    }
};

// Create a new team member
export const createTeamMember = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const merchantId = (req as any).user.merchantId;

        if (userId !== merchantId) {
            return res.status(403).json({ error: 'Only the account owner can add team members' });
        }

        // Check subscription (PRO or ENTERPRISE required)
        const subscription = await prisma.subscription.findUnique({
            where: { merchantId: userId }
        });

        if (!subscription || !['PRO', 'ENTERPRISE'].includes(subscription.plan)) {
            return res.status(403).json({ error: 'Upgrade to PRO plan to add team members' });
        }

        const data = createTeamMemberSchema.parse(req.body);

        // Check if email already exists
        const existing = await prisma.teamMember.findFirst({
            where: { email: data.email }
        });

        if (existing) {
            return res.status(400).json({ error: 'Team member with this email already exists' });
        }

        // Hash PIN if provided
        let hashedPin = null;
        if (data.pin) {
            hashedPin = await bcrypt.hash(data.pin, 10);
        }

        const teamMember = await prisma.teamMember.create({
            data: {
                merchantId: userId,
                name: data.name,
                email: data.email,
                phoneNumber: data.phoneNumber,
                pin: hashedPin,
                role: data.role,
                permissions: data.permissions ? JSON.stringify(data.permissions) : JSON.stringify({
                    canMakeSales: true,
                    canViewReports: false,
                    canManageInventory: false,
                    canProcessWithdrawals: false
                })
            },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                role: true,
                status: true,
                permissions: true,
                createdAt: true
            }
        });

        res.status(201).json({
            ...teamMember,
            permissions: JSON.parse(teamMember.permissions || '{}')
        });

    } catch (error: any) {
        console.error("Create Team Member Error:", error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.issues });
        }
        res.status(500).json({ error: error.message || 'Failed to create team member' });
    }
};

// Update team member
export const updateTeamMember = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const merchantId = (req as any).user.merchantId;
        const { id } = req.params;

        if (userId !== merchantId) {
            return res.status(403).json({ error: 'Only the account owner can update team members' });
        }

        const data = updateTeamMemberSchema.parse(req.body);

        // Verify ownership
        const member = await prisma.teamMember.findFirst({
            where: { id, merchantId: userId }
        });

        if (!member) {
            return res.status(404).json({ error: 'Team member not found' });
        }

        // Hash PIN if provided
        let hashedPin = undefined;
        if (data.pin) {
            hashedPin = await bcrypt.hash(data.pin, 10);
        }

        const updated = await prisma.teamMember.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.email && { email: data.email }),
                ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
                ...(hashedPin && { pin: hashedPin }),
                ...(data.role && { role: data.role }),
                ...(data.status && { status: data.status }),
                ...(data.permissions && { permissions: JSON.stringify(data.permissions) })
            },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                role: true,
                status: true,
                permissions: true
            }
        });

        res.json({
            ...updated,
            permissions: JSON.parse(updated.permissions || '{}')
        });

    } catch (error: any) {
        console.error("Update Team Member Error:", error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.issues });
        }
        res.status(500).json({ error: error.message || 'Failed to update team member' });
    }
};

// Delete/Suspend team member
export const deleteTeamMember = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const merchantId = (req as any).user.merchantId;
        const { id } = req.params;

        if (userId !== merchantId) {
            return res.status(403).json({ error: 'Only the account owner can delete team members' });
        }

        // Verify ownership
        const member = await prisma.teamMember.findFirst({
            where: { id, merchantId: userId }
        });

        if (!member) {
            return res.status(404).json({ error: 'Team member not found' });
        }

        // Suspend instead of delete (preserve audit trail)
        await prisma.teamMember.update({
            where: { id },
            data: { status: 'SUSPENDED' }
        });

        res.json({ message: 'Team member suspended successfully' });

    } catch (error) {
        console.error("Delete Team Member Error:", error);
        res.status(500).json({ error: 'Failed to remove team member' });
    }
};

// Verify PIN
export const verifyPIN = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const merchantId = (req as any).user.merchantId;
        const { pin, teamMemberId } = req.body;

        if (!pin || !teamMemberId) {
            return res.status(400).json({ error: 'PIN and team member ID required' });
        }

        const member = await prisma.teamMember.findFirst({
            where: {
                id: teamMemberId,
                merchantId: merchantId,
                status: 'ACTIVE'
            }
        });

        if (!member) {
            return res.status(404).json({ error: 'Team member not found or inactive' });
        }

        if (!member.pin) {
            return res.status(400).json({ error: 'Team member does not have a PIN set' });
        }

        const isValid = await bcrypt.compare(pin, member.pin);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid PIN' });
        }

        res.json({
            valid: true,
            teamMember: {
                id: member.id,
                name: member.name,
                role: member.role,
                permissions: JSON.parse(member.permissions || '{}')
            }
        });

    } catch (error) {
        console.error("Verify PIN Error:", error);
        res.status(500).json({ error: 'Failed to verify PIN' });
    }
};
