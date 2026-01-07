import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Generate enterprise license key
export const generateLicenseKey = (): string => {
    const key = crypto.randomBytes(16).toString('hex');
    return `ENT-${key.toUpperCase()}`;
};

// Create or upgrade subscription
export const upgradeSubscription = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const merchantId = (req as any).user.merchantId;
        const { plan, paymentMethod } = req.body;

        // Validate plan
        const validPlans = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
        if (!validPlans.includes(plan)) {
            return res.status(400).json({ error: 'Invalid plan' });
        }

        // Get current subscription
        let subscription = await prisma.subscription.findUnique({
            where: { merchantId }
        });

        // Calculate end date based on plan
        let endDate: Date | null = null;
        if (plan !== 'FREE' && plan !== 'ENTERPRISE') {
            endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);
        }

        // Generate license key for enterprise
        let licenseKey: string | undefined;
        let supportExpiresAt: Date | undefined;
        if (plan === 'ENTERPRISE') {
            licenseKey = generateLicenseKey();
            supportExpiresAt = new Date();
            supportExpiresAt.setFullYear(supportExpiresAt.getFullYear() + 1);
        }

        if (subscription) {
            // Update existing subscription
            subscription = await prisma.subscription.update({
                where: { merchantId },
                data: {
                    plan,
                    status: 'ACTIVE',
                    endDate,
                    isEnterprise: plan === 'ENTERPRISE',
                    licenseKey: licenseKey || subscription.licenseKey,
                    supportExpiresAt: supportExpiresAt || subscription.supportExpiresAt,
                    monthlyTxCount: plan === 'BASIC' ? subscription.monthlyTxCount : 0
                }
            });
        } else {
            // Create new subscription
            subscription = await prisma.subscription.create({
                data: {
                    merchantId,
                    plan,
                    status: 'ACTIVE',
                    endDate,
                    isEnterprise: plan === 'ENTERPRISE',
                    licenseKey,
                    supportExpiresAt
                }
            });
        }

        // Create notification
        await prisma.notification.create({
            data: {
                userId,
                title: 'Subscription Updated',
                message: `Your subscription has been upgraded to ${plan} plan`,
                type: 'success'
            }
        });

        res.json({
            success: true,
            subscription,
            message: `Successfully upgraded to ${plan} plan`
        });

    } catch (error: any) {
        console.error('Upgrade subscription error:', error);
        res.status(500).json({ error: 'Failed to upgrade subscription' });
    }
};

// Get subscription status (for frontend)
export const getSubscriptionStatus = async (req: Request, res: Response) => {
    try {
        const merchantId = (req as any).user.merchantId;

        let subscription = await prisma.subscription.findUnique({
            where: { merchantId }
        });

        if (!subscription) {
            // Create default FREE subscription
            subscription = await prisma.subscription.create({
                data: {
                    merchantId,
                    plan: 'FREE',
                    status: 'ACTIVE'
                }
            });
        }

        res.json(subscription);
    } catch (error) {
        console.error('Get subscription status error:', error);
        res.status(500).json({ error: 'Failed to fetch subscription status' });
    }
};

// Initiate M-Pesa payment for subscription
export const initiateSubscriptionPayment = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const merchantId = (req as any).user.merchantId;
        const { plan, phoneNumber } = req.body;

        // Validate plan and get price
        const planPrices: Record<string, number> = {
            'BASIC': 1500,
            'PRO': 2500,
            'ENTERPRISE': 75000
        };

        if (!planPrices[plan]) {
            return res.status(400).json({ error: 'Invalid plan or plan not available for purchase' });
        }

        const amount = planPrices[plan];

        // Import M-Pesa service
        const { initiateStkPush } = await import('../services/mpesa.service');

        // Initiate STK push
        const result = await initiateStkPush(
            phoneNumber,
            amount,
            `Subscription: ${plan} Plan`,
            merchantId
        );

        // Store pending subscription upgrade
        await prisma.transaction.create({
            data: {
                type: 'SUBSCRIPTION_PAYMENT',
                amount,
                reference: result.CheckoutRequestID,
                status: 'PENDING',
                initiatorUserId: userId,
                metadata: JSON.stringify({
                    plan,
                    phoneNumber,
                    checkoutRequestId: result.CheckoutRequestID
                })
            }
        });

        res.json({
            success: true,
            message: 'Payment request sent to your phone',
            checkoutRequestId: result.CheckoutRequestID
        });

    } catch (error: any) {
        console.error('Initiate subscription payment error:', error);
        res.status(500).json({
            error: error.message || 'Failed to initiate payment'
        });
    }
};

// Validate enterprise license key
export const validateLicenseKey = async (req: Request, res: Response) => {
    try {
        const { licenseKey } = req.body;

        const subscription = await prisma.subscription.findUnique({
            where: { licenseKey },
            include: {
                merchant: {
                    select: {
                        email: true,
                        businessProfile: {
                            select: {
                                companyName: true
                            }
                        }
                    }
                }
            }
        });

        if (!subscription) {
            return res.status(404).json({
                valid: false,
                error: 'Invalid license key'
            });
        }

        if (!subscription.isEnterprise) {
            return res.status(400).json({
                valid: false,
                error: 'License key is not for enterprise plan'
            });
        }

        // Check support expiry
        const supportExpired = subscription.supportExpiresAt &&
            new Date(subscription.supportExpiresAt) < new Date();

        res.json({
            valid: true,
            subscription: {
                plan: subscription.plan,
                status: subscription.status,
                supportExpired,
                supportExpiresAt: subscription.supportExpiresAt,
                companyName: subscription.merchant.businessProfile?.companyName
            }
        });

    } catch (error) {
        console.error('Validate license error:', error);
        res.status(500).json({ error: 'Failed to validate license' });
    }
};
