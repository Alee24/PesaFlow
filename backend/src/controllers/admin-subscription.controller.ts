import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Admin endpoint to assign/update subscription for a merchant
export const assignSubscription = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { plan } = req.body;

        // Validate plan
        const validPlans = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
        if (!validPlans.includes(plan)) {
            return res.status(400).json({ error: 'Invalid subscription plan' });
        }

        // Check if user exists and is a merchant
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.role !== 'MERCHANT') {
            return res.status(400).json({ error: 'Can only assign subscriptions to merchants' });
        }

        // Calculate end date
        let endDate: Date | null = null;
        if (plan !== 'FREE' && plan !== 'ENTERPRISE') {
            endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);
        }

        // Upsert subscription
        const subscription = await prisma.subscription.upsert({
            where: { merchantId: userId },
            update: {
                plan,
                status: 'ACTIVE',
                endDate
            },
            create: {
                merchantId: userId,
                plan,
                status: 'ACTIVE',
                endDate
            }
        });

        // Create notification for merchant
        await prisma.notification.create({
            data: {
                userId,
                title: 'Subscription Updated',
                message: `Your subscription has been updated to ${plan} plan by admin`,
                type: 'success'
            }
        });

        res.json({
            success: true,
            subscription,
            message: `Subscription updated to ${plan}`
        });

    } catch (error: any) {
        console.error('Assign subscription error:', error);
        res.status(500).json({ error: 'Failed to assign subscription' });
    }
};
