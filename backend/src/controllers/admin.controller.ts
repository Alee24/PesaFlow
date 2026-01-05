import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

export const getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                businessProfile: true,
                _count: {
                    select: {
                        products: true,
                        sales: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createUser = async (req: AuthRequest, res: Response) => {
    try {
        const { name, email, phoneNumber, password, role } = req.body;

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { phoneNumber }]
            }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User with this email or phone already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                phoneNumber,
                passwordHash: hashedPassword,
                role: role || 'MERCHANT',
                status: 'ACTIVE',
                wallet: {
                    create: {
                        balance: 0
                    }
                },
                businessProfile: {
                    create: {
                        companyName: `${name}'s Business`
                    }
                }
            }
        });

        res.status(201).json({ message: 'User created successfully', userId: newUser.id });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateUserStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body; // ACTIVE, SUSPENDED, REJECTED

        if (!['ACTIVE', 'SUSPENDED', 'REJECTED', 'PENDING_VERIFICATION'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                status,
                appealNotes: notes || null
            }
        });

        res.json({ message: `User status updated to ${status}`, user: updatedUser });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAdminStats = async (req: AuthRequest, res: Response) => {
    try {
        const activeMerchants = await prisma.user.count({
            where: { role: 'MERCHANT', status: 'ACTIVE' }
        });

        const totalVolumeAgg = await prisma.transaction.aggregate({
            _sum: { amount: true },
            where: { status: 'COMPLETED' }
        });
        const totalVolume = totalVolumeAgg._sum.amount || 0;

        const netIncomeAgg = await prisma.transaction.aggregate({
            _sum: { feeCharged: true },
            where: { status: 'COMPLETED' }
        });
        const netIncome = netIncomeAgg._sum.feeCharged || 0;

        const pendingPayouts = await prisma.withdrawal.count({
            where: { status: 'PENDING' }
        });

        const recentLogs = await prisma.transaction.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                initiator: { select: { name: true, email: true } }
            }
        });

        res.json({
            activeMerchants,
            totalVolume,
            netIncome,
            pendingPayouts,
            recentLogs
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, phoneNumber, role } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                name,
                email,
                phoneNumber,
                role
            }
        });

        res.json({ message: 'User updated successfully', user: updatedUser });
    } catch (error: any) {
        if (error.code === 'P2002') {
             return res.status(400).json({ error: 'Email or phone number already exists' });
        }
        res.status(500).json({ error: error.message });
    }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        
        // Prevent deleting self
        if (req.user?.userId === id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        await prisma.user.delete({
            where: { id }
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const resetUserPassword = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id },
            data: {
                passwordHash: hashedPassword
            }
        });

        res.json({ message: 'Password reset successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
