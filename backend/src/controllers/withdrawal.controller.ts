
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
        const widthdrawAmount = Number(amount);

        if (widthdrawAmount < 10) return res.status(400).json({ error: 'Minimum withdrawal is KES 10' });

        const wallet = await prisma.wallet.findFirst({ where: { userId: req.user.userId } });
        if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

        if (Number(wallet.balance) < widthdrawAmount) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }

        // Create withdrawal request
        const withdrawal = await prisma.withdrawal.create({
            data: {
                walletId: wallet.id,
                amount: widthdrawAmount,
                mpesaNumber: mpesaNumber || 'SAME_AS_USER', // Or fetch from user profile
                status: 'PENDING'
            }
        });

        // Deduct balance immediately or hold it? 
        // Best practice: Deduct immediately to prevent double spend, refund if rejected.
        await prisma.wallet.update({
            where: { id: wallet.id },
            data: { balance: { decrement: widthdrawAmount } }
        });

        res.status(201).json(withdrawal);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to request withdrawal' });
    }
};
