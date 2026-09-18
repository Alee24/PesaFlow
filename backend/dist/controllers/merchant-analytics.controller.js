"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeamPerformance = exports.getInventoryStatus = exports.getFinancialMetrics = exports.getCustomerInsights = exports.getProductPerformance = exports.getSalesOverview = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getSalesOverview = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { startDate, endDate } = req.query;
        let start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        let end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);
        const sales = await prisma.sale.findMany({
            where: {
                merchantId: userId,
                createdAt: { gte: start, lte: end }
            }
        });
        let totalRevenue = 0;
        let paymentMethods = {};
        let revenueByDayMap = {};
        sales.forEach(sale => {
            totalRevenue += Number(sale.totalAmount);
            paymentMethods[sale.paymentMethod] = (paymentMethods[sale.paymentMethod] || 0) + Number(sale.totalAmount);
            const dateStr = sale.createdAt.toISOString().split('T')[0];
            revenueByDayMap[dateStr] = (revenueByDayMap[dateStr] || 0) + Number(sale.totalAmount);
        });
        const revenueByDay = Object.keys(revenueByDayMap).map(date => ({
            date,
            revenue: revenueByDayMap[date]
        })).sort((a, b) => a.date.localeCompare(b.date));
        res.json({
            summary: {
                totalRevenue,
                totalTransactions: sales.length,
                averageOrderValue: sales.length ? totalRevenue / sales.length : 0
            },
            paymentMethods,
            revenueByDay
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.getSalesOverview = getSalesOverview;
const getProductPerformance = async (req, res) => {
    res.json([]);
};
exports.getProductPerformance = getProductPerformance;
const getCustomerInsights = async (req, res) => {
    res.json({});
};
exports.getCustomerInsights = getCustomerInsights;
const getFinancialMetrics = async (req, res) => {
    try {
        const userId = req.user.userId;
        const sales = await prisma.sale.findMany({ where: { merchantId: userId } });
        const totalRev = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
        res.json({ grossProfit: totalRev, vatLiability: totalRev * 0.16 });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.getFinancialMetrics = getFinancialMetrics;
const getInventoryStatus = async (req, res) => {
    res.json({});
};
exports.getInventoryStatus = getInventoryStatus;
const getTeamPerformance = async (req, res) => {
    res.json({});
};
exports.getTeamPerformance = getTeamPerformance;
//# sourceMappingURL=merchant-analytics.controller.js.map