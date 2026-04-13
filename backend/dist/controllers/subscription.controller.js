"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiateSubscription = exports.getSubscription = void 0;
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const prisma = new client_1.PrismaClient();
const getMpesaCreds = async (userId) => {
    const profile = await prisma.businessProfile.findUnique({ where: { userId } });
    const creds = {
        consumerKey: profile?.mpesaConsumerKey || process.env.MPESA_CONSUMER_KEY,
        consumerSecret: profile?.mpesaConsumerSecret || process.env.MPESA_CONSUMER_SECRET,
        passkey: profile?.mpesaPasskey || process.env.MPESA_PASSKEY,
        shortCode: profile?.mpesaShortcode || process.env.MPESA_SHORTCODE,
        callbackUrl: profile?.mpesaCallbackUrl || process.env.MPESA_CALLBACK_URL || (process.env.APP_URL ? `${process.env.APP_URL}/api/mpesa/callback` : 'http://localhost:3001/api/mpesa/callback'),
        env: profile?.mpesaEnv || process.env.MPESA_ENV || 'sandbox'
    };
    return creds;
};
const getAccessToken = async (creds) => {
    const url = creds.env === 'production'
        ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
        : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    const auth = Buffer.from(`${creds.consumerKey}:${creds.consumerSecret}`).toString('base64');
    try {
        const response = await axios_1.default.get(url, { headers: { Authorization: `Basic ${auth}` } });
        return response.data.access_token;
    }
    catch (error) {
        throw new Error('Failed to get Access Token');
    }
};
const getSubscription = async (req, res) => {
    try {
        const userId = req.user.userId;
        console.log(`🔍 [GET /subscriptions] Fetching for userId: ${userId}`);
        let sub = await prisma.subscription.findUnique({
            where: { merchantId: userId }
        });
        console.log(`   > Found Subscription:`, sub ? `ID: ${sub.id} | Plan: ${sub.plan} | Status: ${sub.status}` : 'Not Found');
        if (!sub) {
            return res.json({
                plan: 'NONE',
                status: 'INACTIVE',
                daysRemaining: 0,
                canAccess: false
            });
        }
        const now = new Date();
        const endDate = sub.endDate ? new Date(sub.endDate) : new Date();
        const diffTime = endDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isExpired = daysRemaining < 0;
        const isInGracePeriod = isExpired && daysRemaining > -3;
        res.json({
            ...sub,
            daysRemaining,
            isExpired,
            isInGracePeriod,
            canAccess: !isExpired || isInGracePeriod
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch subscription' });
    }
};
exports.getSubscription = getSubscription;
const initiateSubscription = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { plan, phoneNumber } = req.body;
        const amount = plan === 'PRO' ? 2500 : 1000;
        const creds = await getMpesaCreds(userId);
        const token = await getAccessToken(creds);
        const date = new Date();
        const timestamp = date.getFullYear() +
            ('0' + (date.getMonth() + 1)).slice(-2) +
            ('0' + date.getDate()).slice(-2) +
            ('0' + date.getHours()).slice(-2) +
            ('0' + date.getMinutes()).slice(-2) +
            ('0' + date.getSeconds()).slice(-2);
        const password = Buffer.from(`${creds.shortCode}${creds.passkey}${timestamp}`).toString('base64');
        const url = creds.env === 'production'
            ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
            : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
        const formattedPhone = phoneNumber.startsWith('0') ? `254${phoneNumber.slice(1)}` : phoneNumber;
        const stkRes = await axios_1.default.post(url, {
            BusinessShortCode: creds.shortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: formattedPhone,
            PartyB: creds.shortCode,
            PhoneNumber: formattedPhone,
            CallBackURL: creds.callbackUrl,
            AccountReference: `SUB-${plan}`,
            TransactionDesc: `Subscription for ${plan}`,
        }, { headers: { Authorization: `Bearer ${token}` } });
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        const sub = await prisma.subscription.upsert({
            where: { merchantId: userId },
            update: {
                plan,
                status: 'ACTIVE',
                startDate,
                endDate,
                lastPaymentId: stkRes.data.CheckoutRequestID
            },
            create: {
                merchantId: userId,
                plan,
                status: 'ACTIVE',
                startDate,
                endDate,
                features: '[]',
                lastPaymentId: stkRes.data.CheckoutRequestID
            }
        });
        res.json({ success: true, message: 'STK Push sent & Subscription Activated (Prototype Mode)', subscription: sub });
    }
    catch (error) {
        console.error('Subscription Pay Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to initiate subscription payment' });
    }
};
exports.initiateSubscription = initiateSubscription;
//# sourceMappingURL=subscription.controller.js.map
