"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServiceChargeReport = exports.getMerchantPerformance = exports.getSystemDashboard = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getSystemDashboard = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const now = new Date();
        let startDate = new Date();
        switch (period) {
            case 'day':
                startDate.setDate(now.getDate() - 1);
                break;
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
        }
        const [totalMerchants, activeMerchants, totalTransactions, completedTransactions, totalRevenue, serviceCharges] = await Promise.all([
            prisma.user.count({ where: { role: 'MERCHANT' } }),
            prisma.user.count({ where: { role: 'MERCHANT', status: 'ACTIVE' } }),
            prisma.transaction.count({ where: { createdAt: { gte: startDate } } }),
            prisma.transaction.count({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: startDate }
                }
            }),
            prisma.transaction.aggregate({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: startDate }
                },
                _sum: { amount: true }
            }),
            prisma.transaction.aggregate({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: startDate }
                },
                _sum: { feeCharged: true }
            })
        ]);
        const successRate = totalTransactions > 0
            ? (completedTransactions / totalTransactions) * 100
            : 0;
        const totalRevenueAmount = Number(totalRevenue._sum.amount || 0);
        const avgTransactionValue = completedTransactions > 0
            ? totalRevenueAmount / completedTransactions
            : 0;
        const topMerchants = await prisma.transaction.groupBy({
            by: ['initiatorUserId'],
            where: {
                status: 'COMPLETED',
                createdAt: { gte: startDate },
                initiatorUserId: { not: null }
            },
            _sum: {
                amount: true,
                feeCharged: true
            },
            _count: {
                id: true
            },
            orderBy: {
                _sum: {
                    amount: 'desc'
                }
            },
            take: 10
        });
        const merchantIds = topMerchants.map(m => m.initiatorUserId).filter((id) => id !== null);
        const merchants = await prisma.user.findMany({
            where: { id: { in: merchantIds } },
            include: {
                businessProfile: {
                    select: { companyName: true }
                }
            }
        });
        const topMerchantsWithDetails = topMerchants.map(tm => {
            const merchant = merchants.find(m => m.id === tm.initiatorUserId);
            return {
                merchantId: tm.initiatorUserId || '',
                merchantName: merchant?.businessProfile?.companyName || merchant?.name || merchant?.email || 'Unknown',
                revenue: Number(tm._sum.amount || 0),
                transactions: tm._count.id,
                serviceChargesPaid: Number(tm._sum.feeCharged || 0)
            };
        });
        const paymentMethods = await prisma.sale.groupBy({
            by: ['paymentMethod'],
            where: {
                createdAt: { gte: startDate },
                paymentStatus: 'PAID'
            },
            _sum: {
                totalAmount: true
            },
            _count: {
                id: true
            }
        });
        const totalPayments = paymentMethods.reduce((sum, pm) => sum + Number(pm._sum.totalAmount || 0), 0);
        const paymentMethodStats = paymentMethods.map(pm => ({
            method: pm.paymentMethod,
            count: pm._count.id,
            amount: Number(pm._sum.totalAmount || 0),
            percentage: totalPayments > 0 ? (Number(pm._sum.totalAmount || 0) / totalPayments) * 100 : 0
        }));
        let dailyTrends = [];
        try {
            const rawTrends = await prisma.$queryRaw `
                SELECT
                    DATE(created_at) as date,
                    COUNT(*) as count,
                    SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END) as revenue,
                    SUM(CASE WHEN status = 'COMPLETED' THEN fee_charged ELSE 0 END) as fees
                FROM transactions
                WHERE created_at >= ${startDate}
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            `;
            dailyTrends = rawTrends.map((trend) => ({
                date: trend.date,
                count: Number(trend.count),
                revenue: Number(trend.revenue),
                fees: Number(trend.fees)
            }));
        }
        catch (error) {
            console.error('Error fetching daily trends:', error);
            dailyTrends = [];
        }
        const subscriptionStats = await prisma.subscription.groupBy({
            by: ['plan'],
            _count: {
                id: true
            }
        });
        const subscriptionBreakdown = subscriptionStats.reduce((acc, sub) => {
            acc[sub.plan] = sub._count.id;
            return acc;
        }, {});
        const branchPerformance = [];
        const totalRevenueNum = Number(totalRevenue._sum.amount || 0);
        const serviceChargesNum = Number(serviceCharges._sum.feeCharged || 0);
        res.json({
            overview: {
                totalRevenue: totalRevenueNum,
                serviceCharges: serviceChargesNum,
                netRevenue: totalRevenueNum - serviceChargesNum,
                totalMerchants,
                activeMerchants,
                totalTransactions,
                completedTransactions,
                successRate: Math.round(successRate * 100) / 100,
                avgTransactionValue: Math.round(avgTransactionValue * 100) / 100
            },
            topMerchants: topMerchantsWithDetails,
            paymentMethods: paymentMethodStats,
            trends: dailyTrends,
            subscriptions: subscriptionBreakdown,
            branches: branchPerformance,
            period
        });
    }
    catch (error) {
        console.error('System Dashboard Error:', error);
        res.status(500).json({ error: 'Failed to fetch system dashboard data', details: error.message });
    }
};
exports.getSystemDashboard = getSystemDashboard;
const getMerchantPerformance = async (req, res) => {
    try {
        const { merchantId } = req.params;
        const { period = 'month' } = req.query;
        const now = new Date();
        let startDate = new Date();
        switch (period) {
            case 'day':
                startDate.setDate(now.getDate() - 1);
                break;
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
        }
        const [merchant, stats, transactions] = await Promise.all([
            prisma.user.findUnique({
                where: { id: merchantId },
                include: {
                    businessProfile: true,
                    subscription: true
                }
            }),
            prisma.transaction.aggregate({
                where: {
                    initiatorUserId: merchantId,
                    status: 'COMPLETED',
                    createdAt: { gte: startDate }
                },
                _sum: {
                    amount: true,
                    feeCharged: true
                },
                _count: {
                    id: true
                }
            }),
            prisma.transaction.findMany({
                where: {
                    initiatorUserId: merchantId,
                    createdAt: { gte: startDate }
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    type: true,
                    amount: true,
                    status: true,
                    createdAt: true,
                    reference: true
                }
            })
        ]);
        if (!merchant) {
            return res.status(404).json({ error: 'Merchant not found' });
        }
        res.json({
            merchant: {
                id: merchant.id,
                name: merchant.name,
                email: merchant.email,
                companyName: merchant.businessProfile?.companyName,
                subscriptionPlan: merchant.subscription?.plan || 'FREE',
                subscriptionStatus: merchant.subscription?.status || 'ACTIVE'
            },
            performance: {
                totalRevenue: Number(stats._sum.amount || 0),
                serviceChargesPaid: Number(stats._sum.feeCharged || 0),
                netRevenue: Number(stats._sum.amount || 0) - Number(stats._sum.feeCharged || 0),
                transactionCount: stats._count.id
            },
            recentTransactions: transactions
        });
    }
    catch (error) {
        console.error('Merchant Performance Error:', error);
        res.status(500).json({ error: 'Failed to fetch merchant performance', details: error.message });
    }
};
exports.getMerchantPerformance = getMerchantPerformance;
const getServiceChargeReport = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const now = new Date();
        let startDate = new Date();
        switch (period) {
            case 'day':
                startDate.setDate(now.getDate() - 1);
                break;
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
        }
        const serviceChargeData = await prisma.transaction.groupBy({
            by: ['initiatorUserId'],
            where: {
                status: 'COMPLETED',
                createdAt: { gte: startDate },
                feeCharged: { gt: 0 }
            },
            _sum: {
                feeCharged: true,
                amount: true
            },
            _count: {
                id: true
            },
            orderBy: {
                _sum: {
                    feeCharged: 'desc'
                }
            }
        });
        const merchantIds = serviceChargeData.map(sc => sc.initiatorUserId).filter((id) => id !== null);
        const merchants = await prisma.user.findMany({
            where: { id: { in: merchantIds } },
            include: {
                businessProfile: {
                    select: { companyName: true }
                }
            }
        });
        const report = serviceChargeData.map(sc => {
            const merchant = merchants.find(m => m.id === sc.initiatorUserId);
            const feeCharged = Number(sc._sum.feeCharged || 0);
            const amount = Number(sc._sum.amount || 0);
            return {
                merchantId: sc.initiatorUserId || '',
                merchantName: merchant?.businessProfile?.companyName || merchant?.name || 'Unknown',
                totalServiceCharges: feeCharged,
                totalRevenue: amount,
                transactionCount: sc._count.id,
                avgServiceCharge: feeCharged / sc._count.id
            };
        });
        const totalServiceCharges = report.reduce((sum, r) => sum + r.totalServiceCharges, 0);
        res.json({
            totalServiceCharges,
            report,
            period
        });
    }
    catch (error) {
        console.error('Service Charge Report Error:', error);
        res.status(500).json({ error: 'Failed to fetch service charge report', details: error.message });
    }
};
exports.getServiceChargeReport = getServiceChargeReport;
//# sourceMappingURL=admin-dashboard.controller.js.map
