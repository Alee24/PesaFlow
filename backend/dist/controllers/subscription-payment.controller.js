"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLicenseKey = exports.initiateSubscriptionPayment = exports.getSubscriptionStatus = exports.upgradeSubscription = exports.generateLicenseKey = void 0;
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
const generateLicenseKey = () => {
    const key = crypto_1.default.randomBytes(16).toString('hex');
    return `ENT-${key.toUpperCase()}`;
};
exports.generateLicenseKey = generateLicenseKey;
const upgradeSubscription = async (req, res) => {
    try {
        const userId = req.user.userId;
        const merchantId = req.user.merchantId;
        const { plan, paymentMethod } = req.body;
        const validPlans = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
        if (!validPlans.includes(plan)) {
            return res.status(400).json({ error: 'Invalid plan' });
        }
        let subscription = await prisma.subscription.findUnique({
            where: { merchantId }
        });
        let endDate = null;
        if (plan !== 'FREE' && plan !== 'ENTERPRISE') {
            endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);
        }
        let licenseKey;
        let supportExpiresAt;
        if (plan === 'ENTERPRISE') {
            licenseKey = (0, exports.generateLicenseKey)();
            supportExpiresAt = new Date();
            supportExpiresAt.setFullYear(supportExpiresAt.getFullYear() + 1);
        }
        if (subscription) {
            subscription = await prisma.subscription.update({
                where: { merchantId },
                data: {
                    plan,
                    status: 'ACTIVE',
                    endDate
                }
            });
        }
        else {
            subscription = await prisma.subscription.create({
                data: {
                    merchantId,
                    plan,
                    status: 'ACTIVE',
                    endDate,
                    features: '[]'
                }
            });
        }
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
    }
    catch (error) {
        console.error('Upgrade subscription error:', error);
        res.status(500).json({ error: 'Failed to upgrade subscription' });
    }
};
exports.upgradeSubscription = upgradeSubscription;
const getSubscriptionStatus = async (req, res) => {
    try {
        const merchantId = req.user.merchantId;
        let subscription = await prisma.subscription.findUnique({
            where: { merchantId }
        });
        if (!subscription) {
            subscription = await prisma.subscription.create({
                data: {
                    merchantId,
                    plan: 'FREE',
                    status: 'ACTIVE',
                    features: '[]'
                }
            });
        }
        res.json(subscription);
    }
    catch (error) {
        console.error('Get subscription status error:', error);
        res.status(500).json({ error: 'Failed to fetch subscription status' });
    }
};
exports.getSubscriptionStatus = getSubscriptionStatus;
const initiateSubscriptionPayment = async (req, res) => {
    try {
        const userId = req.user.userId;
        const merchantId = req.user.merchantId;
        const { plan, phoneNumber } = req.body;
        const planPrices = {
            'BASIC': 1500,
            'PRO': 2500,
            'ENTERPRISE': 75000
        };
        if (!planPrices[plan]) {
            return res.status(400).json({ error: 'Invalid plan or plan not available for purchase' });
        }
        const amount = planPrices[plan];
        const { initiateSTKPush } = await Promise.resolve().then(() => __importStar(require('../services/mpesa.service')));
        const result = await initiateSTKPush(phoneNumber, amount, `Subscription: ${plan} Plan`, merchantId, []);
        res.json({
            success: true,
            message: 'Payment request sent to your phone',
            checkoutRequestId: result.CheckoutRequestID
        });
    }
    catch (error) {
        console.error('Initiate subscription payment error:', error);
        res.status(500).json({
            error: error.message || 'Failed to initiate payment'
        });
    }
};
exports.initiateSubscriptionPayment = initiateSubscriptionPayment;
const validateLicenseKey = async (req, res) => {
    try {
        const { licenseKey } = req.body;
        const subscription = await prisma.subscription.findFirst({
            where: {
                plan: 'ENTERPRISE'
            },
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
        res.json({
            valid: true,
            subscription: {
                plan: subscription.plan,
                status: subscription.status,
                companyName: subscription.merchant.businessProfile?.companyName
            }
        });
    }
    catch (error) {
        console.error('Validate license error:', error);
        res.status(500).json({ error: 'Failed to validate license' });
    }
};
exports.validateLicenseKey = validateLicenseKey;
//# sourceMappingURL=subscription-payment.controller.js.map