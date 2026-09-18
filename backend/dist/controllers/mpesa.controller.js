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
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetMpesaConfig = exports.testConnection = exports.bulkProcess = exports.initiateInvoicePayment = exports.mpesaCallback = exports.stkPush = void 0;
const mpesa_service_1 = require("../services/mpesa.service");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const stkPush = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { phoneNumber, amount, items, saleId } = req.body;
        if (!phoneNumber || !amount) {
            res.status(400).json({ error: 'Phone number and amount required' });
            return;
        }
        console.log(`Initiating STK Push for ${phoneNumber} amount ${amount}${saleId ? ` (Retry for sale ${saleId})` : ''}`);
        const response = await (0, mpesa_service_1.initiateSTKPush)(phoneNumber, Number(amount), 'POS Sale', req.user.userId, items, undefined, saleId);
        console.log('STK Initiation Successful:', response);
        res.json(response);
    }
    catch (error) {
        console.error('STK Push Controller Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};
exports.stkPush = stkPush;
const mpesaCallback = async (req, res) => {
    console.log('M-Pesa Callback Received:', JSON.stringify(req.body, null, 2));
    try {
        if (req.body.Body?.stkCallback) {
            const { stkCallback } = req.body.Body;
            const merchantRequestID = stkCallback.MerchantRequestID;
            const resultCode = stkCallback.ResultCode;
            const transaction = await prisma.transaction.findFirst({
                where: { merchantRequestId: merchantRequestID }
            });
            if (transaction && resultCode === 0) {
                const metaItems = stkCallback.CallbackMetadata.Item;
                const receipt = metaItems.find((i) => i.Name === 'MpesaReceiptNumber')?.Value;
                const amount = metaItems.find((i) => i.Name === 'Amount')?.Value;
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { status: 'COMPLETED', reference: receipt }
                });
                const updatedWallet = await prisma.wallet.update({
                    where: { id: transaction.recipientWalletId },
                    data: { balance: { increment: Number(amount) - Number(transaction.feeCharged) } }
                });
                try {
                    const { NotificationDispatcher } = await Promise.resolve().then(() => __importStar(require('../services/notification-dispatcher.service')));
                    NotificationDispatcher.dispatch({
                        activity: 'PAYMENT_RECEIVED',
                        userId: updatedWallet.userId,
                        amount: Number(amount),
                        reference: receipt,
                        title: 'M-Pesa Payment Received',
                        message: `Payment of KES ${Number(amount).toLocaleString()} confirmed via M-Pesa STK Push.`
                    });
                }
                catch (notifErr) {
                    console.error('Notification dispatch error:', notifErr);
                }
            }
            else if (transaction) {
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { status: 'FAILED' }
                });
            }
        }
        else if (req.body.Result) {
            const { Result } = req.body;
            const conversationID = Result.ConversationID;
            const originatorConversationID = Result.OriginatorConversationID;
            const resultCode = Result.ResultCode;
            console.log(`[M-Pesa B2C] Callback for ConversationID: ${conversationID}, ResultCode: ${resultCode}`);
            const transaction = await prisma.transaction.findFirst({
                where: {
                    OR: [
                        { merchantRequestId: conversationID },
                        { merchantRequestId: originatorConversationID }
                    ]
                }
            });
            if (transaction) {
                if (resultCode === 0) {
                    const receipt = Result.ResultParameters?.ResultParameter?.find((p) => p.Key === 'TransactionID')?.Value;
                    await prisma.transaction.update({
                        where: { id: transaction.id },
                        data: {
                            status: 'COMPLETED',
                            reference: receipt || transaction.reference
                        }
                    });
                    await prisma.wallet.update({
                        where: { id: transaction.recipientWalletId },
                        data: { balance: { decrement: Number(transaction.amount) } }
                    });
                    console.log(`✅ B2C Disbursement Successful: ${transaction.id}`);
                }
                else {
                    await prisma.transaction.update({
                        where: { id: transaction.id },
                        data: {
                            status: 'FAILED',
                            metadata: JSON.stringify({ ...JSON.parse(transaction.metadata || '{}'), callbackError: Result.ResultDesc })
                        }
                    });
                    console.log(`❌ B2C Disbursement Failed: ${transaction.id} - ${Result.ResultDesc}`);
                }
            }
        }
        res.json({ result: 'ok' });
    }
    catch (error) {
        console.error('Callback Error', error);
        res.status(500).json({ error: 'Callback processing failed' });
    }
};
exports.mpesaCallback = mpesaCallback;
const initiateInvoicePayment = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { invoiceId, phoneNumber } = req.body;
        if (!invoiceId || !phoneNumber) {
            res.status(400).json({ error: 'Invoice ID and Phone Number required' });
            return;
        }
        const invoice = await prisma.transaction.findUnique({ where: { id: invoiceId } });
        if (!invoice) {
            res.status(404).json({ error: 'Invoice not found' });
            return;
        }
        console.log(`Initiating Invoice Payment for ${invoiceId} - ${phoneNumber}`);
        const response = await (0, mpesa_service_1.initiateSTKPush)(phoneNumber, Number(invoice.amount), `Inv ${invoice.reference || 'Ref'}`, req.user.userId, [], invoiceId);
        res.json(response);
    }
    catch (error) {
        console.error('Invoice Payment Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};
exports.initiateInvoicePayment = initiateInvoicePayment;
const bulkProcess = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { payments } = req.body;
        if (!Array.isArray(payments) || payments.length === 0) {
            res.status(400).json({ error: 'Valid payments array required' });
            return;
        }
        console.log(`🚀 [MPESA] Bulk Processing Started for user ${req.user.userId} (${payments.length} items)`);
        const results = [];
        const userId = req.user.userId;
        for (const payment of payments) {
            try {
                const result = await (0, mpesa_service_1.initiateB2CPayment)(payment.phoneNumber, Number(payment.amount), payment.reference || `Bulk-${Date.now()}`, userId, payment.description || 'Mpesa Connect Bulk Payment');
                results.push({ phone: payment.phoneNumber, status: 'SUCCESS' });
            }
            catch (err) {
                results.push({ phone: payment.phoneNumber, status: 'FAILED', error: err.message });
            }
        }
        res.json({
            message: 'Bulk processing completed',
            summary: {
                total: payments.length,
                success: results.filter(r => r.status === 'SUCCESS').length,
                failed: results.filter(r => r.status === 'FAILED').length
            },
            results
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.bulkProcess = bulkProcess;
const testConnection = async (req, res) => {
    const userId = req.user?.userId;
    const { consumerKey, consumerSecret, env } = req.body;
    let providedCreds;
    if (consumerKey && consumerSecret) {
        providedCreds = { consumerKey, consumerSecret, env: env || 'sandbox' };
    }
    const result = await (0, mpesa_service_1.testMpesaConnectionService)(userId, providedCreds);
    if (result.success) {
        res.json(result);
    }
    else {
        res.status(500).json(result);
    }
};
exports.testConnection = testConnection;
const resetMpesaConfig = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.userId;
        await prisma.businessProfile.update({
            where: { userId },
            data: {
                mpesaConsumerKey: null,
                mpesaConsumerSecret: null,
                mpesaPasskey: null,
                mpesaShortcode: null,
                mpesaInitiatorName: null,
                mpesaInitiatorPass: null
            }
        });
        res.json({ success: true, message: 'Settings reset successful' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to reset settings' });
    }
};
exports.resetMpesaConfig = resetMpesaConfig;
//# sourceMappingURL=mpesa.controller.js.map