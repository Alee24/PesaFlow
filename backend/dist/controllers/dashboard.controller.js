"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInvoiceStats = exports.getDashboardStats = void 0;
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const merchant_hierarchy_1 = require("../utils/merchant-hierarchy");
const prisma = new client_1.PrismaClient();
const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { period } = req.query;
        let startDate = (0, date_fns_1.startOfMonth)(new Date());
        if (period === 'day')
            startDate = (0, date_fns_1.startOfDay)(new Date());
        else if (period === 'week')
            startDate = (0, date_fns_1.startOfWeek)(new Date());
        else if (period === 'year')
            startDate = (0, date_fns_1.startOfYear)(new Date());
        const merchantUserIds = await (0, merchant_hierarchy_1.getMerchantUserIds)(userId, userRole);
        let walletIds = [];
        if (userRole === 'ADMIN') {
            const allWallets = await prisma.wallet.findMany({ select: { id: true } });
            walletIds = allWallets.map(w => w.id);
        }
        else {
            const wallets = await prisma.wallet.findMany({
                where: { userId: { in: merchantUserIds } },
                select: { id: true }
            });
            walletIds = wallets.map(w => w.id);
        }
        if (walletIds.length === 0 && userRole !== 'ADMIN') {
            return res.json({ summary: {}, chartData: [], transactions: [] });
        }
        const whereClause = {
            createdAt: { gte: startDate },
            status: 'COMPLETED'
        };
        if (userRole !== 'ADMIN') {
            whereClause.recipientWalletId = { in: walletIds };
        }
        const transactions = await prisma.transaction.findMany({
            where: whereClause,
            orderBy: { createdAt: 'asc' }
        });
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
            }
            else if (tx.type === 'WITHDRAWAL') {
                totalWithdrawals += amount;
            }
        });
        const chartMap = new Map();
        transactions.forEach(tx => {
            const dateKey = (0, date_fns_1.format)(tx.createdAt, 'yyyy-MM-dd');
            if (!chartMap.has(dateKey)) {
                chartMap.set(dateKey, { date: dateKey, income: 0, withdrawal: 0, fees: 0 });
            }
            const entry = chartMap.get(dateKey);
            const amount = Number(tx.amount);
            const fee = Number(tx.feeCharged);
            entry.fees += fee;
            if (['DEPOSIT_STK', 'SALE_CREDIT', 'INVOICE', 'SALE_CASH'].includes(tx.type)) {
                entry.income += amount;
            }
            else if (tx.type === 'WITHDRAWAL') {
                entry.withdrawal += amount;
            }
        });
        const chartData = Array.from(chartMap.values());
        let walletBalance = 0;
        if (userRole === 'ADMIN') {
            const walletAgg = await prisma.wallet.aggregate({ _sum: { balance: true } });
            walletBalance = Number(walletAgg._sum.balance || 0);
        }
        else {
            const mpesaIn = await prisma.transaction.aggregate({
                where: {
                    recipientWallet: { userId: { in: merchantUserIds } },
                    status: 'COMPLETED',
                    type: { in: ['DEPOSIT_STK', 'SALE_CREDIT'] }
                },
                _sum: { amount: true }
            });
            const mpesaOut = await prisma.transaction.aggregate({
                where: {
                    recipientWallet: { userId: { in: merchantUserIds } },
                    status: 'COMPLETED',
                    type: 'WITHDRAWAL'
                },
                _sum: { amount: true, feeCharged: true }
            });
            walletBalance = (Number(mpesaIn._sum.amount) || 0)
                - (Number(mpesaOut._sum.amount) || 0)
                - (Number(mpesaOut._sum.feeCharged) || 0);
        }
        const userProfile = await prisma.businessProfile.findUnique({
            where: { userId },
            select: { vatEnabled: true, vatRate: true }
        });
        let vatStats = {
            vatEnabled: userProfile?.vatEnabled || false,
            totalSalesWithVAT: 0,
            totalVATCollected: 0,
            kraVATOwed: 0
        };
        if (userProfile?.vatEnabled) {
            const vatRate = userProfile.vatRate || 16.0;
            const salesWithVAT = await prisma.sale.findMany({
                where: {
                    merchantId: { in: merchantUserIds },
                    createdAt: { gte: startDate },
                    paymentStatus: { in: ['PAID', 'PARTIAL'] }
                },
                include: {
                    items: {
                        include: {
                            product: {
                                select: { isTaxable: true }
                            }
                        }
                    }
                }
            });
            salesWithVAT.forEach(sale => {
                sale.items.forEach(item => {
                    const itemTotal = Number(item.subtotal);
                    vatStats.totalSalesWithVAT += itemTotal;
                    const vatAmount = itemTotal * (vatRate / 100);
                    vatStats.totalVATCollected += vatAmount;
                });
            });
            vatStats.kraVATOwed = vatStats.totalVATCollected;
        }
        res.json({
            summary: {
                totalIncome,
                totalWithdrawals,
                totalSalesCount,
                totalFeeIncome,
                netVolume: totalIncome - totalWithdrawals,
                walletBalance: walletBalance,
                ...vatStats
            },
            chartData,
            transactions: transactions.slice(0, 10).reverse()
        });
    }
    catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};
exports.getDashboardStats = getDashboardStats;
const getInvoiceStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const merchantUserIds = await (0, merchant_hierarchy_1.getMerchantUserIds)(userId, userRole);
        const wallets = await prisma.wallet.findMany({
            where: { userId: { in: merchantUserIds } },
            select: { id: true }
        });
        if (wallets.length === 0) {
            return res.json({
                paid: { count: 0, amount: 0 },
                pending: { count: 0, amount: 0 },
                overdue: { count: 0, amount: 0 },
                cancelled: { count: 0, amount: 0 },
                total: { count: 0, amount: 0 }
            });
        }
        const walletIds = wallets.map(w => w.id);
        const transactions = await prisma.transaction.findMany({
            where: {
                recipientWalletId: { in: walletIds },
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
            }
            else if (tx.status === 'CANCELLED' || tx.status === 'FAILED') {
                stats.cancelled.count++;
                stats.cancelled.amount += amount;
            }
            else if (tx.status === 'PENDING') {
                const age = now.getTime() - new Date(tx.createdAt).getTime();
                if (age > THIRTY_DAYS_MS) {
                    stats.overdue.count++;
                    stats.overdue.amount += amount;
                }
                else {
                    stats.pending.count++;
                    stats.pending.amount += amount;
                }
            }
        });
        res.json(stats);
    }
    catch (error) {
        console.error("Invoice Stats Error:", error);
        res.status(500).json({ error: 'Failed to fetch invoice stats' });
    }
};
exports.getInvoiceStats = getInvoiceStats;
//# sourceMappingURL=dashboard.controller.js.map