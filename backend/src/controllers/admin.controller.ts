import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { exec, spawn } from 'child_process';
import path from 'path';

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

        // Delete all related records in a transaction
        await prisma.$transaction(async (tx) => {
            // Delete business profile
            await tx.businessProfile.deleteMany({
                where: { userId: id }
            });

            // Delete wallet and related transactions/withdrawals
            const wallet = await tx.wallet.findUnique({
                where: { userId: id }
            });

            if (wallet) {
                // Delete withdrawals
                await tx.withdrawal.deleteMany({
                    where: { walletId: wallet.id }
                });

                // Delete transactions
                await tx.transaction.deleteMany({
                    where: {
                        OR: [
                            {
                                senderWallet: {
                                    userId: id
                                }
                            },
                            {
                                recipientWallet: {
                                    userId: id
                                }
                            }
                        ]
                    }
                });

                // Delete wallet
                await tx.wallet.delete({
                    where: { id: wallet.id }
                });
            }

            // Delete sales and sale items
            const sales = await tx.sale.findMany({
                where: { merchantId: id }
            });

            for (const sale of sales) {
                await tx.saleItem.deleteMany({
                    where: { saleId: sale.id }
                });
            }

            await tx.sale.deleteMany({
                where: { merchantId: id }
            });

            // Delete products
            await tx.product.deleteMany({
                where: { merchantId: id }
            });

            // Delete categories
            await tx.category.deleteMany({
                where: { merchantId: id }
            });

            // Delete team members
            await tx.teamMember.deleteMany({
                where: { merchantId: id }
            });

            // Delete subscription
            await tx.subscription.deleteMany({
                where: { merchantId: id }
            });

            // Finally, delete the user
            await tx.user.delete({
                where: { id }
            });
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete user' });
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

export const manageSubscription = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { plan, extendDays, action } = req.body;

        console.log(`👮 [ADMIN] Managing Subscription for Target User: ${id}`);
        console.log(`   > Action: ${action} | Plan: ${plan} | Extend: ${extendDays}`);

        const transaction = await prisma.$transaction(async (tx) => {
            let sub = await tx.subscription.findUnique({ where: { merchantId: id } });

            if (action === 'SET_PLAN') {
                const startDate = new Date();
                const endDate = new Date();

                // Keep existing end date if valid and just upgrading? 
                // For simplicity, RESET to 30 days from now for new plan assignment
                endDate.setDate(endDate.getDate() + 30);

                if (plan === 'NONE') {
                    if (sub) {
                        await tx.subscription.delete({ where: { merchantId: id } });
                    }
                    return null;
                }

                sub = await tx.subscription.upsert({
                    where: { merchantId: id },
                    update: {
                        plan,
                        status: 'ACTIVE',
                        startDate: new Date(),
                        endDate, // Reset to 30 days
                    },
                    create: {
                        merchantId: id,
                        plan,
                        status: 'ACTIVE',
                        startDate: new Date(),
                        endDate
                    }
                });
            } else if (action === 'EXTEND') {
                if (!sub) throw new Error("User has no active subscription to extend");

                const currentEnd = sub.endDate ? new Date(sub.endDate) : new Date();
                // If already expired, start extension from NOW, else from current expiry
                const baseDate = currentEnd < new Date() ? new Date() : currentEnd;

                const newEndDate = new Date(baseDate);
                newEndDate.setDate(newEndDate.getDate() + Number(extendDays));

                sub = await tx.subscription.update({
                    where: { merchantId: id },
                    data: {
                        endDate: newEndDate,
                        status: 'ACTIVE' // Reactivate if expired
                    }
                });
            }

            return sub;
        });

        res.json({ message: 'Subscription updated successfully', subscription: transaction });

    } catch (error: any) {
        console.error("Manage Subscription Error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getSystemStatus = async (req: AuthRequest, res: Response) => {
    try {
        // Get git version
        exec('git rev-parse --short HEAD', (error, stdout, stderr) => {
            if (error) {
                console.error('Git Error:', error);
                return res.json({ version: 'Unknown', lastUpdate: new Date() });
            }
            res.json({
                version: stdout.trim(),
                lastUpdate: new Date(),
                status: 'ONLINE'
            });
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Basic In-Memory Store for Update Logs (Not persistent across restarts)
let updateState = {
    isUpdating: false,
    logs: [] as string[]
};

export const getSystemUpdateLogs = async (req: AuthRequest, res: Response) => {
    res.json(updateState);
};

export const triggerSystemUpdate = async (req: AuthRequest, res: Response) => {
    try {
        if (updateState.isUpdating) {
            return res.status(400).json({ error: 'Update already in progress' });
        }

        const updateScript = path.join(process.cwd(), '../update.sh'); // Expects update.sh in root
        const projectRoot = path.join(process.cwd(), '../'); // Move out of backend/

        console.log(`Triggering update via: ${updateScript} from ${projectRoot}`);

        updateState.isUpdating = true;
        updateState.logs = [`🚀 Starting System Update at ${new Date().toISOString()}...`];

        // 1. Spawn process from Project Root
        const child = spawn('bash', [updateScript], { cwd: projectRoot });

        child.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach((line: string) => {
                if (line.trim()) {
                    console.log(`[UPDATE] ${line}`);
                    updateState.logs.push(line.trim());
                }
            });
        });

        child.stderr.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach((line: string) => {
                if (line.trim()) {
                    console.error(`[UPDATE ERROR] ${line}`);
                    updateState.logs.push(`ERR: ${line.trim()}`);
                }
            });
        });

        child.on('close', (code) => {
            console.log(`Update process exited with code ${code}`);
            updateState.isUpdating = false;
            updateState.logs.push(`🏁 Update Process Finished with code ${code}`);
            if (code === 0) {
                updateState.logs.push(`✅ SUCCESS. Refresh page to see changes.`);
            } else {
                updateState.logs.push(`❌ FAILED. Check logs above.`);
            }
        });

        res.json({ message: 'System update initiated. Check logs for progress.' });
    } catch (error: any) {
        updateState.isUpdating = false;
        res.status(500).json({ error: error.message });
    }
};

