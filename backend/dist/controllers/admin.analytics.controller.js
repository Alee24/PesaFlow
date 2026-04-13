"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopProducts = exports.getRevenueTrends = exports.getPaymentMethods = exports.getTopMerchants = exports.getOverview = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getOverview = async (req, res) => {
    try {
        const [totalRevenue, totalTransactions, totalMerchants, totalCustomers, paidSales, allSales] = await Promise.all([
            prisma.sale.aggregate({
                where: { paymentStatus: 'PAID' },
                _sum: { totalAmount: true }
            }),
            prisma.transaction.count(),
            prisma.user.count({
                where: {
                    role: { in: ['MERCHANT', 'BRANCH_MANAGER'] },
                    status: 'ACTIVE'
                }
            }),
            prisma.customer.count(),
            prisma.sale.count({ where: { paymentStatus: 'PAID' } }),
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
    }
    catch (error) {
        console.error('Admin Analytics Overview Error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.getOverview = getOverview;
const getTopMerchants = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
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
                    select: { companyName: true }
                },
                _count: {
                    select: { sales: true }
                }
            }
        });
        const merchantStats = await Promise.all(merchants.map(async (merchant) => {
            const sales = await prisma.sale.findMany({
                where: {
                    merchantId: merchant.id,
                    paymentStatus: 'PAID'
                },
                select: { totalAmount: true }
            });
            const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
            return {
                id: merchant.id,
                name: merchant.businessProfile?.companyName || merchant.email,
                email: merchant.email,
                totalRevenue,
                transactionCount: sales.length,
                successRate: 100,
                lastActive: merchant.createdAt
            };
        }));
        const topMerchants = merchantStats
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, limit);
        res.json(topMerchants);
    }
    catch (error) {
        console.error('Admin Analytics Top Merchants Error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.getTopMerchants = getTopMerchants;
const getPaymentMethods = async (req, res) => {
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
    }
    catch (error) {
        console.error('Admin Analytics Payment Methods Error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.getPaymentMethods = getPaymentMethods;
const getRevenueTrends = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
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
        const trendMap = new Map();
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
    }
    catch (error) {
        console.error('Admin Analytics Revenue Trends Error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.getRevenueTrends = getRevenueTrends;
const getTopProducts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
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
        const productDetails = await Promise.all(products.map(async (item) => {
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
        }));
        res.json(productDetails);
    }
    catch (error) {
        console.error('Admin Analytics Top Products Error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.getTopProducts = getTopProducts;
//# sourceMappingURL=admin.analytics.controller.js.map
