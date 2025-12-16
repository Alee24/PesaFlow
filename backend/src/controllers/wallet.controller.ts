import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getWalletStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.userId;

        const wallet = await prisma.wallet.findUnique({
            where: { userId },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                },
                withdrawals: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!wallet) {
            res.status(404).json({ error: 'Wallet not found' });
            return;
        }

        const totalWithdrawn = await prisma.withdrawal.aggregate({
            where: {
                walletId: wallet.id,
                status: 'COMPLETED'
            },
            _sum: {
                amount: true
            }
        });

        const pendingWithdrawals = await prisma.withdrawal.aggregate({
            where: {
                walletId: wallet.id,
                status: 'PENDING'
            },
            _sum: {
                amount: true
            }
        });

        res.json({
            balance: wallet.balance,
            currency: wallet.currency,
            lastUpdated: wallet.lastUpdatedAt,
            totalWithdrawn: totalWithdrawn._sum.amount || 0,
            pendingAmount: pendingWithdrawals._sum.amount || 0,
            lastWithdrawal: wallet.withdrawals[0] || null,
            recentTransactions: wallet.transactions
        });

    } catch (error) {
        console.error("Get Wallet Stats Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
