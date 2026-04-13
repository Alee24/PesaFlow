"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleDailySalesSummary = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("@prisma/client");
const email_service_1 = require("./email.service");
const date_fns_1 = require("date-fns");
const prisma = new client_1.PrismaClient();
const scheduleDailySalesSummary = () => {
    node_cron_1.default.schedule('0 20 * * *', async () => {
        console.log("Running Daily Sales Summary Job...");
        try {
            const merchants = await prisma.user.findMany({
                where: { role: 'MERCHANT', status: 'ACTIVE' },
                include: { businessProfile: true }
            });
            const todayStart = (0, date_fns_1.startOfDay)(new Date());
            const todayEnd = (0, date_fns_1.endOfDay)(new Date());
            for (const merchant of merchants) {
                if (!merchant.email)
                    continue;
                const sales = await prisma.sale.aggregate({
                    where: {
                        merchantId: merchant.id,
                        createdAt: {
                            gte: todayStart,
                            lte: todayEnd
                        }
                    },
                    _sum: { totalAmount: true },
                    _count: true
                });
                const totalAmount = sales._sum.totalAmount || 0;
                const totalCount = sales._count;
                if (totalCount === 0)
                    continue;
                console.log(`Sending summary to ${merchant.email}: KES ${totalAmount}`);
                const html = `
                    <h1>Daily Sales Summary</h1>
                    <p>Good evening ${merchant.businessProfile?.companyName || merchant.name || 'Merchant'},</p>
                    <p>Here is your sales summary for today (${todayStart.toLocaleDateString()}):</p>
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
                        <h2 style="margin: 0; color: #4f46e5;">KES ${Number(totalAmount).toLocaleString()}</h2>
                        <p style="margin: 5px 0 0; color: #6b7280;">Total Sales Volume</p>
                    </div>
                    <p>Total Transactions: <b>${totalCount}</b></p>
                    <br>
                    <p>Keep up the great work!</p>
                `;
                await (0, email_service_1.sendEmail)(merchant.id, merchant.email, `Daily Sales Summary - ${todayStart.toLocaleDateString()}`, html);
            }
        }
        catch (error) {
            console.error("Daily Sales Cron Error:", error);
        }
    });
};
exports.scheduleDailySalesSummary = scheduleDailySalesSummary;
//# sourceMappingURL=scheduler.service.js.map
