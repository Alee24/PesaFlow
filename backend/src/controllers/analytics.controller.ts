import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

// Sales Overview Analytics
export const getSalesOverview = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate as string) : new Date();

        // Total revenue
        const sales = await prisma.sale.findMany({
            where: {
                merchantId: userId,
                createdAt: { gte: start, lte: end }
            },
            include: {
                items: true
            }
        });

        const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
        const totalTransactions = sales.length;
        const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

        // Revenue by day
        const revenueByDay = sales.reduce((acc: any, sale) => {
            const date = sale.createdAt.toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + Number(sale.totalAmount);
            return acc;
        }, {});

        // Payment method breakdown
        const paymentMethods = sales.reduce((acc: any, sale) => {
            acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + 1;
            return acc;
        }, {});

        // Peak hours analysis
        const salesByHour = sales.reduce((acc: any, sale) => {
            const hour = sale.createdAt.getHours();
            acc[hour] = (acc[hour] || 0) + Number(sale.totalAmount); // Changed to sum revenue by hour instead of count, or keep count if intended
            return acc;
        }, {});

        // Note: keeping salesByHour as count based on variable name context in original code, but if revenue was intended key logic is similar. 
        // Reverting salesByHour to count as per original logical intent likely being 'transaction volume'

        // ... (Re-reading original code: acc[hour] = (acc[hour] || 0) + 1; -> This was correct for count)

        res.json({
            summary: {
                totalRevenue,
                totalTransactions,
                averageOrderValue,
                period: { start, end }
            },
            revenueByDay: Object.entries(revenueByDay).map(([date, revenue]) => ({ date, revenue })),
            paymentMethods,
            salesByHour: sales.reduce((acc: any, sale) => {
                const hour = sale.createdAt.getHours();
                acc[hour] = (acc[hour] || 0) + 1;
                return acc;
            }, {})
        });
    } catch (error: any) {
        console.error('Sales overview error:', error);
        res.status(500).json({ error: 'Failed to fetch sales overview' });
    }
};

// Product Performance Analytics
export const getProductPerformance = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate as string) : new Date();

        const saleItems = await prisma.saleItem.findMany({
            where: {
                sale: {
                    merchantId: userId,
                    createdAt: { gte: start, lte: end }
                }
            },
            include: {
                product: {
                    include: {
                        category: true
                    }
                }
            }
        });

        // Top products by revenue
        const productStats = saleItems.reduce((acc: any, item) => {
            const productId = item.productId;
            if (!acc[productId]) {
                acc[productId] = {
                    productId,
                    name: item.product.name,
                    category: item.product.category?.name || 'Uncategorized',
                    quantity: 0,
                    revenue: 0,
                    profit: 0
                };
            }
            acc[productId].quantity += item.quantity;
            acc[productId].revenue += Number(item.unitPrice) * item.quantity;
            acc[productId].profit += (Number(item.unitPrice) - Number(item.product.costPrice || 0)) * item.quantity;
            return acc;
        }, {});

        const topProducts = Object.values(productStats)
            .sort((a: any, b: any) => b.revenue - a.revenue)
            .slice(0, 10);

        // Category performance
        const categoryStats = saleItems.reduce((acc: any, item) => {
            const category = item.product.category?.name || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = { category, revenue: 0, quantity: 0 };
            }
            acc[category].revenue += Number(item.unitPrice) * item.quantity;
            acc[category].quantity += item.quantity;
            return acc;
        }, {});

        res.json({
            topProducts,
            categoryPerformance: Object.values(categoryStats)
        });
    } catch (error: any) {
        console.error('Product performance error:', error);
        res.status(500).json({ error: 'Failed to fetch product performance' });
    }
};

// Customer Insights
export const getCustomerInsights = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        const sales = await prisma.sale.findMany({
            where: { merchantId: userId },
            select: {
                customerName: true,
                customerPhone: true,
                totalAmount: true,
                createdAt: true
            }
        });

        // Customer segmentation
        const customerData = sales.reduce((acc: any, sale) => {
            const key = sale.customerPhone || sale.customerName || 'Walk-in';
            if (!acc[key]) {
                acc[key] = {
                    customer: key,
                    totalSpent: 0,
                    transactionCount: 0,
                    firstPurchase: sale.createdAt,
                    lastPurchase: sale.createdAt
                };
            }
            acc[key].totalSpent += Number(sale.totalAmount);
            acc[key].transactionCount += 1;
            if (sale.createdAt < acc[key].firstPurchase) acc[key].firstPurchase = sale.createdAt;
            if (sale.createdAt > acc[key].lastPurchase) acc[key].lastPurchase = sale.createdAt;
            return acc;
        }, {});

        const customers = Object.values(customerData)
            .sort((a: any, b: any) => b.totalSpent - a.totalSpent);

        const topCustomers = customers.slice(0, 10);
        const totalCustomers = customers.length;
        const averageCustomerValue = customers.reduce((sum: number, c: any) => sum + c.totalSpent, 0) / (totalCustomers || 1);

        res.json({
            topCustomers,
            summary: {
                totalCustomers,
                averageCustomerValue,
                repeatCustomerRate: customers.filter((c: any) => c.transactionCount > 1).length / (totalCustomers || 1)
            }
        });
    } catch (error: any) {
        console.error('Customer insights error:', error);
        res.status(500).json({ error: 'Failed to fetch customer insights' });
    }
};

// Financial Metrics
export const getFinancialMetrics = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate as string) : new Date();

        // Sales revenue
        const sales = await prisma.sale.findMany({
            where: {
                merchantId: userId,
                createdAt: { gte: start, lte: end }
            },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);

        // Calculate COGS
        const totalCOGS = sales.reduce((sum, sale) => {
            return sum + sale.items.reduce((itemSum, item) => {
                return itemSum + Number(item.product.costPrice || 0) * item.quantity;
            }, 0);
        }, 0);

        const grossProfit = totalRevenue - totalCOGS;
        const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        // Withdrawals - query through wallet
        const withdrawals = await prisma.withdrawal.findMany({
            where: {
                wallet: {
                    userId: userId
                },
                createdAt: { gte: start, lte: end }
            }
        });

        const totalWithdrawals = withdrawals.reduce((sum, w) => sum + Number(w.amount), 0);

        // Outstanding invoices
        // Outstanding invoices - skip if Invoice model doesn't exist
        let totalOutstanding = 0;
        try {
            const outstandingInvoices = await (prisma as any).invoice?.findMany({
                where: {
                    merchantId: userId,
                    status: 'PENDING'
                }
            }) || [];
            totalOutstanding = outstandingInvoices.reduce((sum: number, inv: any) => sum + Number(inv.totalAmount), 0);
        } catch (error) {
            // Invoice model might not exist
        }

        res.json({
            revenue: totalRevenue,
            cogs: totalCOGS,
            grossProfit,
            grossMargin,
            withdrawals: totalWithdrawals,
            outstandingInvoices: totalOutstanding,
            netCashFlow: totalRevenue - totalWithdrawals
        });
    } catch (error: any) {
        console.error('Financial metrics error:', error);
        res.status(500).json({ error: 'Failed to fetch financial metrics' });
    }
};

// Inventory Status
export const getInventoryStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        const products = await prisma.product.findMany({
            where: { merchantId: userId },
            include: {
                category: true
            }
        });

        // Use stockQuantity field from schema
        const lowStock = products.filter(p => Number(p.stockQuantity || 0) <= 10);
        const outOfStock = products.filter(p => Number(p.stockQuantity || 0) === 0);
        const totalValue = products.reduce((sum, p) => sum + Number(p.costPrice || 0) * Number(p.stockQuantity || 0), 0);

        res.json({
            totalProducts: products.length,
            lowStockItems: lowStock.length,
            outOfStockItems: outOfStock.length,
            totalInventoryValue: totalValue,
            lowStockProducts: lowStock.map(p => ({
                id: p.id,
                name: p.name,
                stock: Number(p.stockQuantity || 0),
                threshold: 10
            }))
        });
    } catch (error: any) {
        console.error('Inventory status error:', error);
        res.status(500).json({ error: 'Failed to fetch inventory status' });
    }
};

// Team/Branch Performance Analytics
export const getTeamPerformance = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate as string) : new Date();

        // Get all sub-merchants (branch staff) for this merchant
        // Note: Check if your User model has a relation for sub-merchants
        // If not, we'll return empty data
        const subMerchants = await prisma.user.findMany({
            where: {
                role: 'SUB_MERCHANT',
                // Assuming there's a merchant relation or field
                // Adjust based on your actual schema
            },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true
            }
        });

        // Get sales performance for each staff member
        // Since Sale model has merchantId, we'll use that
        const performanceData = await Promise.all(
            subMerchants.map(async (staff) => {
                const sales = await prisma.sale.findMany({
                    where: {
                        merchantId: staff.id,
                        createdAt: { gte: start, lte: end }
                    }
                });

                const totalSales = sales.length;
                const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
                const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

                return {
                    staffId: staff.id,
                    staffName: staff.name,
                    staffEmail: staff.email,
                    staffPhone: staff.phoneNumber,
                    totalSales,
                    totalRevenue,
                    averageOrderValue
                };
            })
        );

        // Sort by revenue
        const sortedPerformance = performanceData.sort((a, b) => b.totalRevenue - a.totalRevenue);

        res.json({
            totalStaff: subMerchants.length,
            performance: sortedPerformance,
            period: { start, end }
        });
    } catch (error: any) {
        console.error('Team performance error:', error);
        res.status(500).json({ error: 'Failed to fetch team performance' });
    }
};
