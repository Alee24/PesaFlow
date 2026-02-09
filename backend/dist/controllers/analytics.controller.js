"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeamPerformance = exports.getInventoryStatus = exports.getFinancialMetrics = exports.getCustomerInsights = exports.getProductPerformance = exports.getSalesOverview = void 0;
const client_1 = require("@prisma/client");
const merchant_hierarchy_1 = require("../utils/merchant-hierarchy");
const prisma = new client_1.PrismaClient();
const getSalesOverview = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
        const merchantUserIds = await (0, merchant_hierarchy_1.getMerchantUserIds)(userId, userRole);
        const sales = await prisma.sale.findMany({
            where: {
                merchantId: { in: merchantUserIds },
                createdAt: { gte: start, lte: end }
            },
            include: {
                items: true,
                transaction: true
            }
        });
        const totalRevenue = sales.reduce((sum, sale) => {
            const isPaid = sale.paymentStatus === 'PAID' ||
                sale.paymentStatus === 'PARTIAL' ||
                sale.transaction?.status === 'COMPLETED';
            if (isPaid) {
                const paid = Number(sale.amountPaid);
                return sum + (paid > 0 ? paid : Number(sale.totalAmount));
            }
            return sum;
        }, 0);
        const totalTransactions = sales.length;
        const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
        const revenueByDay = sales.reduce((acc, sale) => {
            const isPaid = sale.paymentStatus === 'PAID' ||
                sale.paymentStatus === 'PARTIAL' ||
                sale.transaction?.status === 'COMPLETED';
            if (isPaid) {
                const date = sale.createdAt.toISOString().split('T')[0];
                const paid = Number(sale.amountPaid);
                acc[date] = (acc[date] || 0) + (paid > 0 ? paid : Number(sale.totalAmount));
            }
            return acc;
        }, {});
        const paymentMethods = sales.reduce((acc, sale) => {
            acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + 1;
            return acc;
        }, {});
        const salesByHour = sales.reduce((acc, sale) => {
            const hour = sale.createdAt.getHours();
            acc[hour] = (acc[hour] || 0) + Number(sale.totalAmount);
            return acc;
        }, {});
        res.json({
            summary: {
                totalRevenue,
                totalTransactions,
                averageOrderValue,
                period: { start, end }
            },
            revenueByDay: Object.entries(revenueByDay).map(([date, revenue]) => ({ date, revenue })),
            paymentMethods,
            salesByHour: sales.reduce((acc, sale) => {
                const hour = sale.createdAt.getHours();
                acc[hour] = (acc[hour] || 0) + 1;
                return acc;
            }, {})
        });
    }
    catch (error) {
        console.error('Sales overview error:', error);
        res.status(500).json({ error: 'Failed to fetch sales overview' });
    }
};
exports.getSalesOverview = getSalesOverview;
const getProductPerformance = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
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
        const productStats = saleItems.reduce((acc, item) => {
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
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);
        const categoryStats = saleItems.reduce((acc, item) => {
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
    }
    catch (error) {
        console.error('Product performance error:', error);
        res.status(500).json({ error: 'Failed to fetch product performance' });
    }
};
exports.getProductPerformance = getProductPerformance;
const getCustomerInsights = async (req, res) => {
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
        const customerData = sales.reduce((acc, sale) => {
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
            if (sale.createdAt < acc[key].firstPurchase)
                acc[key].firstPurchase = sale.createdAt;
            if (sale.createdAt > acc[key].lastPurchase)
                acc[key].lastPurchase = sale.createdAt;
            return acc;
        }, {});
        const customers = Object.values(customerData)
            .sort((a, b) => b.totalSpent - a.totalSpent);
        const topCustomers = customers.slice(0, 10);
        const totalCustomers = customers.length;
        const averageCustomerValue = customers.reduce((sum, c) => sum + c.totalSpent, 0) / (totalCustomers || 1);
        res.json({
            topCustomers,
            summary: {
                totalCustomers,
                averageCustomerValue,
                repeatCustomerRate: customers.filter((c) => c.transactionCount > 1).length / (totalCustomers || 1)
            }
        });
    }
    catch (error) {
        console.error('Customer insights error:', error);
        res.status(500).json({ error: 'Failed to fetch customer insights' });
    }
};
exports.getCustomerInsights = getCustomerInsights;
const getFinancialMetrics = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
        if (endDate) {
            end.setHours(23, 59, 59, 999);
        }
        const sales = await prisma.sale.findMany({
            where: {
                merchantId: userId,
                createdAt: { gte: start, lte: end }
            },
            include: {
                transaction: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });
        let totalRevenue = 0;
        let totalCOGS = 0;
        let totalVATLiability = 0;
        const profile = await prisma.businessProfile.findUnique({
            where: { userId },
            select: { vatEnabled: true, vatRate: true }
        });
        const vatRate = profile?.vatRate ? Number(profile.vatRate) : 16.0;
        const isVatEnabled = profile?.vatEnabled || false;
        sales.forEach(sale => {
            const isPaid = sale.paymentStatus === 'PAID' ||
                sale.paymentStatus === 'PARTIAL' ||
                sale.transaction?.status === 'COMPLETED';
            if (isPaid) {
                const paid = Number(sale.amountPaid);
                totalRevenue += (paid > 0 ? paid : Number(sale.totalAmount));
                sale.items.forEach(item => {
                    totalCOGS += Number(item.product.costPrice || 0) * item.quantity;
                    if (isVatEnabled) {
                        const itemTotal = Number(item.subtotal);
                        const vat = itemTotal * (vatRate / 100);
                        totalVATLiability += vat;
                    }
                });
            }
        });
        const grossProfit = totalRevenue - totalCOGS;
        const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        const withdrawals = await prisma.withdrawal.findMany({
            where: {
                wallet: {
                    userId: userId
                },
                createdAt: { gte: start, lte: end }
            }
        });
        const totalWithdrawals = withdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
        const outstandingSales = await prisma.sale.findMany({
            where: {
                merchantId: userId,
                paymentStatus: { in: ['PENDING', 'PARTIAL'] },
                paymentMethod: 'INVOICE'
            }
        });
        const totalOutstanding = outstandingSales.reduce((sum, sale) => sum + Number(sale.amountDue), 0);
        res.json({
            revenue: totalRevenue,
            cogs: totalCOGS,
            grossProfit,
            grossMargin,
            withdrawals: totalWithdrawals,
            outstandingInvoices: totalOutstanding,
            netCashFlow: totalRevenue - totalWithdrawals,
            vatLiability: totalVATLiability
        });
    }
    catch (error) {
        console.error('Financial metrics error:', error);
        res.status(500).json({ error: 'Failed to fetch financial metrics' });
    }
};
exports.getFinancialMetrics = getFinancialMetrics;
const getInventoryStatus = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const products = await prisma.product.findMany({
            where: { merchantId: userId },
            include: {
                category: true
            }
        });
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
    }
    catch (error) {
        console.error('Inventory status error:', error);
        res.status(500).json({ error: 'Failed to fetch inventory status' });
    }
};
exports.getInventoryStatus = getInventoryStatus;
const getTeamPerformance = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
        const teamMembers = await prisma.user.findMany({
            where: {
                OR: [
                    { id: userId },
                    { parentId: userId }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                role: true
            }
        });
        const performanceData = await Promise.all(teamMembers.map(async (staff) => {
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
                role: staff.role,
                totalSales,
                totalRevenue,
                averageOrderValue
            };
        }));
        const sortedPerformance = performanceData.sort((a, b) => b.totalRevenue - a.totalRevenue);
        res.json({
            totalStaff: teamMembers.length,
            performance: sortedPerformance,
            period: { start, end }
        });
    }
    catch (error) {
        console.error('Team performance error:', error);
        res.status(500).json({ error: 'Failed to fetch team performance' });
    }
};
exports.getTeamPerformance = getTeamPerformance;
//# sourceMappingURL=analytics.controller.js.map