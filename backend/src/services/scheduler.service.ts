
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from './email.service';
import { startOfDay, endOfDay, subDays } from 'date-fns';

const prisma = new PrismaClient();

export const scheduleDailySalesSummary = () => {
    // Run every day at 8:00 PM (20:00)
    cron.schedule('0 20 * * *', async () => {
        console.log("Running Daily Sales Summary Job...");

        try {
            // Get all active merchants
            const merchants = await prisma.user.findMany({
                where: { role: 'MERCHANT', status: 'ACTIVE' },
                include: { businessProfile: true }
            });

            const todayStart = startOfDay(new Date());
            const todayEnd = endOfDay(new Date());

            for (const merchant of merchants) {
                if (!merchant.email) continue;

                // Calculate Daily Sales
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

                if (totalCount === 0) continue; // Skip if no sales

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

                await sendEmail(merchant.id, merchant.email, `Daily Sales Summary - ${todayStart.toLocaleDateString()}`, html);
            }

        } catch (error) {
            console.error("Daily Sales Cron Error:", error);
        }
    });
};
