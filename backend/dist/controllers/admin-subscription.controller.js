"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignSubscription = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const assignSubscription = async (req, res) => {
    try {
        const { userId } = req.params;
        const { plan } = req.body;
        const validPlans = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
        if (!validPlans.includes(plan)) {
            return res.status(400).json({ error: 'Invalid subscription plan' });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.role !== 'MERCHANT') {
            return res.status(400).json({ error: 'Can only assign subscriptions to merchants' });
        }
        let endDate = null;
        if (plan !== 'FREE' && plan !== 'ENTERPRISE') {
            endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);
        }
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
                endDate,
                features: '[]'
            }
        });
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
    }
    catch (error) {
        console.error('Assign subscription error:', error);
        res.status(500).json({ error: 'Failed to assign subscription' });
    }
};
exports.assignSubscription = assignSubscription;
//# sourceMappingURL=admin-subscription.controller.js.map
