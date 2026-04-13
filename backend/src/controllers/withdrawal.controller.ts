
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

export const getWithdrawals = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const wallet = await prisma.wallet.findFirst({ where: { userId: req.user.userId } });
        if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

        const withdrawals = await prisma.withdrawal.findMany({
            where: { walletId: wallet.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(withdrawals);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch withdrawals' });
    }
};

export const requestWithdrawal = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const { amount, mpesaNumber } = req.body;
        const requestedAmount = Number(amount);

        if (requestedAmount < 10) return res.status(400).json({ error: 'Minimum withdrawal is KES 10' });

        const fee = requestedAmount * 0.02; // 2% fee
        const totalDeduction = requestedAmount + fee;

        const wallet = await prisma.wallet.findFirst({ where: { userId: req.user.userId } });
        if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

        if (Number(wallet.balance) < totalDeduction) {
            return res.status(400).json({ error: `Insufficient funds. You need KES ${totalDeduction.toLocaleString()} (including 2% fee).` });
        }

        // Create withdrawal request
        const withdrawal = await prisma.withdrawal.create({
            data: {
                walletId: wallet.id,
                amount: requestedAmount,
                fee: fee,
                mpesaNumber: mpesaNumber || 'SAME_AS_USER',
                status: 'PENDING'
            }
        });

        // Deduct balance immediately
        await prisma.wallet.update({
            where: { id: wallet.id },
            data: { balance: { decrement: totalDeduction } }
        });

        res.status(201).json(withdrawal);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to request withdrawal' });
    }
};

// Admin Functions
export const getAllWithdrawals = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Access denied' });

        const withdrawals = await prisma.withdrawal.findMany({
            include: {
                wallet: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, phoneNumber: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(withdrawals);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch withdrawals' });
    }
};

export const approveWithdrawal = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Access denied' });

        const { id } = req.params;
        const withdrawal = await prisma.withdrawal.findUnique({
            where: { id },
            include: { wallet: true }
        });

        if (!withdrawal || withdrawal.status !== 'PENDING') {
            return res.status(400).json({ error: 'Invalid or already processed withdrawal' });
        }

        // Update withdrawal status
        await prisma.withdrawal.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                approvedBy: req.user.userId
            }
        });

        // Create Transaction record for history and fee tracking
        await prisma.transaction.create({
            data: {
                type: 'WITHDRAWAL',
                amount: withdrawal.amount,
                feeCharged: withdrawal.fee,
                status: 'COMPLETED',
                initiatorUserId: withdrawal.wallet.userId,
                recipientWalletId: withdrawal.walletId,
                reference: `WD-${withdrawal.id.slice(0, 8).toUpperCase()}`,
                metadata: JSON.stringify({ mpesaNumber: withdrawal.mpesaNumber })
            }
        });

        res.json({ message: 'Withdrawal approved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to approve withdrawal' });
    }
};

export const rejectWithdrawal = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Access denied' });

        const { id } = req.params;
        const { reason } = req.body;

        const withdrawal = await prisma.withdrawal.findUnique({
            where: { id }
        });

        if (!withdrawal || withdrawal.status !== 'PENDING') {
            return res.status(400).json({ error: 'Invalid withdrawal' });
        }

        const totalRefund = Number(withdrawal.amount) + Number(withdrawal.fee);

        // Update withdrawal status
        await prisma.withdrawal.update({
            where: { id },
            data: { status: 'REJECTED' }
        });

        // Refund wallet
        await prisma.wallet.update({
            where: { id: withdrawal.walletId },
            data: { balance: { increment: totalRefund } }
        });

        res.json({ message: 'Withdrawal rejected and funds refunded' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to reject withdrawal' });
    }
};
