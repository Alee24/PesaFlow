"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWalletStats = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getWalletStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const wallet = await prisma.wallet.findUnique({
            where: { userId },
            include: {
                transactions: {
                    where: {
                        type: { in: ['DEPOSIT_STK', 'WITHDRAWAL', 'FEE'] }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10
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
        const stkStats = await prisma.transaction.aggregate({
            where: {
                recipientWalletId: wallet.id,
                type: 'DEPOSIT_STK',
                status: 'COMPLETED'
            },
            _sum: {
                amount: true,
                feeCharged: true
            }
        });
        const totalStkDeposits = Number(stkStats._sum.amount || 0);
        const totalStkFees = Number(stkStats._sum.feeCharged || 0);
        const netStkIncome = totalStkDeposits - totalStkFees;
        const withdrawalsStats = await prisma.withdrawal.aggregate({
            where: {
                walletId: wallet.id,
                status: 'COMPLETED'
            },
            _sum: {
                amount: true
            }
        });
        const totalWithdrawn = Number(withdrawalsStats._sum.amount || 0);
        const calculatedBalance = netStkIncome - totalWithdrawn;
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
            balance: calculatedBalance,
            currency: wallet.currency,
            lastUpdated: wallet.lastUpdatedAt,
            totalWithdrawn: totalWithdrawn,
            pendingAmount: pendingWithdrawals._sum.amount || 0,
            lastWithdrawal: wallet.withdrawals[0] || null,
            recentTransactions: wallet.transactions
        });
    }
    catch (error) {
        console.error("Get Wallet Stats Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getWalletStats = getWalletStats;
//# sourceMappingURL=wallet.controller.js.map
