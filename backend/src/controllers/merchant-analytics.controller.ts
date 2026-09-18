import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getSalesOverview = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { startDate, endDate } = req.query;
        
        let start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30*24*60*60*1000);
        let end = endDate ? new Date(endDate as string) : new Date();
        end.setHours(23, 59, 59, 999); // include the end day

        const sales = await prisma.sale.findMany({
            where: {
                merchantId: userId,
                createdAt: { gte: start, lte: end }
            }
        });

        let totalRevenue = 0;
        let paymentMethods = {} as any;
        let revenueByDayMap = {} as any;

        sales.forEach(sale => {
            totalRevenue += sale.totalAmount;
            paymentMethods[sale.paymentMethod] = (paymentMethods[sale.paymentMethod] || 0) + sale.totalAmount;
            
            const dateStr = sale.createdAt.toISOString().split('T')[0];
            revenueByDayMap[dateStr] = (revenueByDayMap[dateStr] || 0) + sale.totalAmount;
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
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

export const getProductPerformance = async (req: Request, res: Response) => {
    res.json([]);
};

export const getCustomerInsights = async (req: Request, res: Response) => {
    res.json({});
};

export const getFinancialMetrics = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const sales = await prisma.sale.findMany({ where: { merchantId: userId }});
        const totalRev = sales.reduce((sum, s) => sum + s.totalAmount, 0);
        res.json({ grossProfit: totalRev, vatLiability: totalRev * 0.16 });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

export const getInventoryStatus = async (req: Request, res: Response) => {
    res.json({});
};

export const getTeamPerformance = async (req: Request, res: Response) => {
    res.json({});
};
