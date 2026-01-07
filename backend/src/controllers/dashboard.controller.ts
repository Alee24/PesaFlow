
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, subDays, format } from 'date-fns';

const prisma = new PrismaClient();

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.merchantId; // Use Merchant ID for scope
        const userRole = (req as any).user.role;
        const { period } = req.query;

        let startDate = startOfMonth(new Date());
        if (period === 'day') startDate = startOfDay(new Date());
        else if (period === 'week') startDate = startOfWeek(new Date());
        else if (period === 'year') startDate = startOfYear(new Date());

        // For ADMIN, we might show everything. For Merchant, show their data.
        // We need the WALLET ID for the merchant to filter transactions efficiently
        let walletId = null;
        if (userRole !== 'ADMIN') {
            const wallet = await prisma.wallet.findFirst({ where: { userId: userId } });
            console.log(`[Dashboard] Fetching for MerchantId: ${userId}, Found Wallet: ${wallet?.id}`);

            if (!wallet) return res.json({ summary: {}, chartData: [], transactions: [] });
            walletId = wallet.id;
        }

        // 1. Fetch Transactions
        const whereClause: any = {
            createdAt: { gte: startDate },
            status: 'COMPLETED'
        };

        if (userRole !== 'ADMIN') {
            // Filter by Wallet (incoming/outgoing from this wallet)
            whereClause.recipientWalletId = walletId;
        }

        const transactions = await prisma.transaction.findMany({
            where: whereClause,
            orderBy: { createdAt: 'asc' }
        });

        // 2. Calculate Totals
        let totalIncome = 0;
        let totalWithdrawals = 0;
        let totalSalesCount = 0;
        let totalFeeIncome = 0;

        transactions.forEach(tx => {
            const amount = Number(tx.amount);
            const fee = Number(tx.feeCharged);
            totalFeeIncome += fee;

            if (['DEPOSIT_STK', 'SALE_CREDIT', 'INVOICE', 'SALE_CASH'].includes(tx.type)) {
                totalIncome += amount;
                totalSalesCount++;
            } else if (tx.type === 'WITHDRAWAL') {
                totalWithdrawals += amount;
            }
        });

        // 3. Chart Data
        const chartMap = new Map<string, { date: string, income: number, withdrawal: number, fees: number }>();
        transactions.forEach(tx => {
            const dateKey = format(tx.createdAt, 'yyyy-MM-dd');
            if (!chartMap.has(dateKey)) {
                chartMap.set(dateKey, { date: dateKey, income: 0, withdrawal: 0, fees: 0 });
            }
            const entry = chartMap.get(dateKey)!;
            const amount = Number(tx.amount);
            const fee = Number(tx.feeCharged);
            entry.fees += fee;

            if (['DEPOSIT_STK', 'SALE_CREDIT', 'INVOICE', 'SALE_CASH'].includes(tx.type)) {
                entry.income += amount;
            } else if (tx.type === 'WITHDRAWAL') {
                entry.withdrawal += amount;
            }
        });

        const chartData = Array.from(chartMap.values());

        // 4. Wallet Balance (Only relevant for merchants, but we can show system total for admin)
        const wallet = userRole === 'ADMIN'
            ? await prisma.wallet.aggregate({ _sum: { balance: true } })
            : await prisma.wallet.findUnique({ where: { userId } });

        res.json({
            summary: {
                totalIncome,
                totalWithdrawals,
                totalSalesCount,
                totalFeeIncome,
                netVolume: totalIncome - totalWithdrawals,
                walletBalance: userRole === 'ADMIN' ? (wallet as any)._sum.balance : (wallet as any)?.balance || 0
            },
            chartData,
            transactions: transactions.slice(0, 10).reverse()
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
}


export const getInvoiceStats = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.merchantId;

        // Fetch wallet first
        const wallet = await prisma.wallet.findFirst({ where: { userId } });
        if (!wallet) return res.json({ paid: { count: 0, amount: 0 }, pending: { count: 0, amount: 0 }, overdue: { count: 0, amount: 0 }, cancelled: { count: 0, amount: 0 }, total: { count: 0, amount: 0 } });

        const transactions = await prisma.transaction.findMany({
            where: {
                recipientWalletId: wallet.id,
                type: { in: ['INVOICE', 'DEPOSIT_STK', 'SALE_CREDIT', 'SALE_CASH'] }
            }
        });

        let stats = {
            paid: { count: 0, amount: 0 },
            pending: { count: 0, amount: 0 },
            overdue: { count: 0, amount: 0 },
            cancelled: { count: 0, amount: 0 },
            total: { count: transactions.length, amount: 0 }
        };

        const now = new Date();
        const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

        transactions.forEach(tx => {
            const amount = Number(tx.amount);
            stats.total.amount += amount;

            if (tx.status === 'COMPLETED' || tx.status === 'PAID') {
                stats.paid.count++;
                stats.paid.amount += amount;
            } else if (tx.status === 'CANCELLED' || tx.status === 'FAILED') {
                stats.cancelled.count++;
                stats.cancelled.amount += amount;
            } else if (tx.status === 'PENDING') {
                // Check overdue
                const age = now.getTime() - new Date(tx.createdAt).getTime();
                if (age > THIRTY_DAYS_MS) {
                    stats.overdue.count++;
                    stats.overdue.amount += amount;
                } else {
                    stats.pending.count++;
                    stats.pending.amount += amount;
                }
            }
        });

        res.json(stats);
    } catch (error) {
        console.error("Invoice Stats Error:", error);
        res.status(500).json({ error: 'Failed to fetch invoice stats' });
    }
};
