import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

// System-wide overview metrics
export const getOverview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const [
            totalRevenue,
            totalTransactions,
            totalMerchants,
            totalCustomers,
            paidSales,
            allSales
        ] = await Promise.all([
            // Total revenue from all paid sales
            prisma.sale.aggregate({
                where: { paymentStatus: 'PAID' },
                _sum: { totalAmount: true }
            }),
            // Total transaction count
            prisma.transaction.count(),
            // Total active merchants
            prisma.user.count({
                where: {
                    role: { in: ['MERCHANT', 'BRANCH_MANAGER'] },
                    status: 'ACTIVE'
                }
            }),
            // Total customers
            prisma.customer.count(),
            // Paid sales count
            prisma.sale.count({ where: { paymentStatus: 'PAID' } }),
            // All sales count
            prisma.sale.count()
        ]);

        const avgTransactionValue = paidSales > 0
            ? Number(totalRevenue._sum.totalAmount || 0) / paidSales
            : 0;

        const successRate = allSales > 0
            ? (paidSales / allSales) * 100
            : 0;

        res.json({
            totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
            totalTransactions,
            totalMerchants,
            totalCustomers,
            avgTransactionValue,
            successRate: Math.round(successRate * 100) / 100
        });
    } catch (error: any) {
        console.error('Admin Analytics Overview Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Top performing merchants
export const getTopMerchants = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;

        const merchants = await prisma.user.findMany({
            where: {
                role: { in: ['MERCHANT', 'BRANCH_MANAGER'] },
                status: 'ACTIVE'
            },
            select: {
                id: true,
                email: true,
                createdAt: true,
                businessProfile: {
                    select: { businessName: true }
                },
                _count: {
                    select: { sales: true }
                }
            }
        });

        // Get sales data separately for each merchant
        const merchantStats = await Promise.all(
            merchants.map(async (merchant) => {
                const sales = await prisma.sale.findMany({
                    where: {
                        merchantId: merchant.id,
                        paymentStatus: 'PAID'
                    },
                    select: { totalAmount: true }
                });

                const totalRevenue = sales.reduce(
                    (sum: number, sale) => sum + Number(sale.totalAmount),
                    0
                );

                return {
                    id: merchant.id,
                    name: merchant.businessProfile?.businessName || merchant.email,
                    email: merchant.email,
                    totalRevenue,
                    transactionCount: sales.length,
                    successRate: 100, // Simplified - only counting paid sales
                    lastActive: merchant.createdAt
                };
            })
        );

        // Sort by revenue and take top N
        const topMerchants = merchantStats
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, limit);

        res.json(topMerchants);
    } catch (error: any) {
        console.error('Admin Analytics Top Merchants Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Payment methods breakdown
export const getPaymentMethods = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const paymentMethods = await prisma.sale.groupBy({
            by: ['paymentMethod', 'paymentStatus'],
            _count: { id: true },
            _sum: { totalAmount: true }
        });

        const breakdown = paymentMethods.map(method => ({
            method: method.paymentMethod,
            status: method.paymentStatus,
            count: method._count.id,
            revenue: Number(method._sum.totalAmount || 0)
        }));

        res.json(breakdown);
    } catch (error: any) {
        console.error('Admin Analytics Payment Methods Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Revenue trends
export const getRevenueTrends = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const days = parseInt(req.query.days as string) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const sales = await prisma.sale.findMany({
            where: {
                paymentStatus: 'PAID',
                createdAt: { gte: startDate }
            },
            select: {
                createdAt: true,
                totalAmount: true
            },
            orderBy: { createdAt: 'asc' }
        });

        // Group by date
        const trendMap = new Map<string, number>();
        sales.forEach(sale => {
            const date = sale.createdAt.toISOString().split('T')[0];
            const current = trendMap.get(date) || 0;
            trendMap.set(date, current + Number(sale.totalAmount));
        });

        const trends = Array.from(trendMap.entries()).map(([date, revenue]) => ({
            date,
            revenue
        }));

        res.json(trends);
    } catch (error: any) {
        console.error('Admin Analytics Revenue Trends Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Top selling products
export const getTopProducts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;

        const products = await prisma.saleItem.groupBy({
            by: ['productId'],
            _sum: {
                quantity: true,
                subtotal: true
            },
            _count: { id: true },
            orderBy: {
                _sum: { subtotal: 'desc' }
            },
            take: limit
        });

        const productDetails = await Promise.all(
            products.map(async (item) => {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                    select: { name: true, price: true }
                });

                return {
                    productId: item.productId,
                    name: product?.name || 'Unknown Product',
                    quantitySold: item._sum.quantity || 0,
                    revenue: Number(item._sum.subtotal || 0),
                    salesCount: item._count.id
                };
            })
        );

        res.json(productDetails);
    } catch (error: any) {
        console.error('Admin Analytics Top Products Error:', error);
        res.status(500).json({ error: error.message });
    }
};
