import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Admin endpoint to assign/update subscription for a merchant
export const assignSubscription = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { plan } = req.body;

        // Validate plan
        const validPlans = ['FREE', 'FREE_1Y', 'BASIC', 'PRO', 'ENTERPRISE'];
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

        // Calculate end date and features
        let endDate: Date | null = null;
        let dbPlan = plan;
        let features = '[]';

        // Define full features list
        const allFeatures = JSON.stringify([
            'invoices', 
            'withdrawals', 
            'team', 
            'analytics', 
            'reports', 
            'CRM', 
            'ADVANCED_CRM',
            'POS',
            'BANK_INTEGRATION'
        ]);

        if (plan === 'FREE_1Y') {
            endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1);
            dbPlan = 'ENTERPRISE'; // Set to ENTERPRISE for 1 year to provide "Full Access"
            features = allFeatures;
        } else if (plan === 'ENTERPRISE') {
            dbPlan = 'ENTERPRISE';
            features = allFeatures;
            // Enterprise stays active until manually changed (null endDate)
        } else if (plan === 'PRO') {
            endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);
            dbPlan = 'PRO';
            features = allFeatures;
        } else if (plan === 'BASIC') {
            endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);
            dbPlan = 'BASIC';
            features = JSON.stringify(['invoices', 'reports', 'CRM', 'POS']);
        } else {
            // Default FREE plan
            dbPlan = 'FREE';
            features = JSON.stringify(['POS', 'reports', 'CRM']);
        }

        // Upsert subscription
        const subscription = await prisma.subscription.upsert({
            where: { merchantId: userId },
            update: {
                plan: dbPlan,
                status: 'ACTIVE',
                endDate,
                features
            },
            create: {
                merchantId: userId,
                plan: dbPlan,
                status: 'ACTIVE',
                endDate,
                features
            }
        });

        // Create notification for merchant
        await prisma.notification.create({
            data: {
                userId,
                title: 'Subscription Updated',
                message: `Your subscription has been updated to ${plan === 'FREE_1Y' ? 'Full Access (1 Year)' : plan} plan by admin.`,
                type: 'success'
            }
        });

        res.json({
            success: true,
            subscription,
            message: `Subscription updated to ${plan} (Stored as ${dbPlan})`
        });

    } catch (error: any) {
        console.error('Assign subscription error:', error);
        res.status(500).json({ error: 'Failed to assign subscription' });
    }
};
