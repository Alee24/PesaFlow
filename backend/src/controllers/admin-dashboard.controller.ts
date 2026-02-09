import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

// Get comprehensive system dashboard data
export const getSystemDashboard = async (req: AuthRequest, res: Response) => {
    try {
        const { period = 'month' } = req.query;

        // Calculate date range based on period
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

        // 1. Overall System Statistics
        const [
            totalMerchants,
            activeMerchants,
            totalTransactions,
            completedTransactions,
            totalRevenue,
            serviceCharges
        ] = await Promise.all([
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

        // 2. Top Merchants by Revenue
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

        // Fetch merchant details
        const merchantIds = topMerchants.map(m => m.initiatorUserId).filter((id): id is string => id !== null);
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

        // 3. Payment Method Breakdown
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

        // 4. Transaction Trends (Last 30 days)
        let dailyTrends: any[] = [];
        try {
            const rawTrends = await prisma.$queryRaw`
                SELECT
                    DATE(created_at) as date,
                    COUNT(*) as count,
                    SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END) as revenue,
                    SUM(CASE WHEN status = 'COMPLETED' THEN fee_charged ELSE 0 END) as fees
                FROM transactions
                WHERE created_at >= ${startDate}
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            ` as any[];

            // Convert BigInt to Number for JSON serialization
            dailyTrends = rawTrends.map((trend: any) => ({
                date: trend.date,
                count: Number(trend.count),
                revenue: Number(trend.revenue),
                fees: Number(trend.fees)
            }));
        } catch (error) {
            console.error('Error fetching daily trends:', error);
            // Provide empty array as fallback
            dailyTrends = [];
        }

        // 5. Subscription Breakdown
        const subscriptionStats = await prisma.subscription.groupBy({
            by: ['plan'],
            _count: {
                id: true
            }
        });

        const subscriptionBreakdown = subscriptionStats.reduce((acc, sub) => {
            acc[sub.plan] = sub._count.id;
            return acc;
        }, {} as Record<string, number>);

        // 6. Branch Statistics - Skip if Branch model doesn't exist
        const branchPerformance: any[] = [];

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

    } catch (error: any) {
        console.error('System Dashboard Error:', error);
        res.status(500).json({ error: 'Failed to fetch system dashboard data', details: error.message });
    }
};

// Get detailed merchant performance
export const getMerchantPerformance = async (req: AuthRequest, res: Response) => {
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

    } catch (error: any) {
        console.error('Merchant Performance Error:', error);
        res.status(500).json({ error: 'Failed to fetch merchant performance', details: error.message });
    }
};

// Get service charge report
export const getServiceChargeReport = async (req: AuthRequest, res: Response) => {
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

        const merchantIds = serviceChargeData.map(sc => sc.initiatorUserId).filter((id): id is string => id !== null);
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

    } catch (error: any) {
        console.error('Service Charge Report Error:', error);
        res.status(500).json({ error: 'Failed to fetch service charge report', details: error.message });
    }
};
