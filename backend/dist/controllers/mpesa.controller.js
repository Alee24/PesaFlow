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
exports.generateProductQrCode = exports.generateQrCode = exports.resetMpesaConfig = exports.testConnection = exports.getMpesaStatus = exports.manualCompleteMpesa = exports.bulkProcess = exports.initiateInvoicePayment = exports.mpesaCallback = exports.stkPush = void 0;
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
            const checkoutRequestID = stkCallback.CheckoutRequestID;
            const resultCode = stkCallback.ResultCode;
            const transaction = await prisma.transaction.findFirst({
                where: {
                    OR: [
                        ...(merchantRequestID ? [{ merchantRequestId: merchantRequestID }] : []),
                        ...(checkoutRequestID ? [{ checkoutRequestId: checkoutRequestID }] : [])
                    ]
                }
            });
            if (transaction && resultCode === 0) {
                const metaItems = stkCallback.CallbackMetadata?.Item || [];
                const receipt = metaItems.find((i) => i.Name === 'MpesaReceiptNumber')?.Value;
                const amount = metaItems.find((i) => i.Name === 'Amount')?.Value || transaction.amount;
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { status: 'COMPLETED', reference: receipt || transaction.reference }
                });
                const walletInfo = await prisma.wallet.findUnique({
                    where: { id: transaction.recipientWalletId },
                    include: { user: { include: { businessProfile: true } } }
                });
                const isCustomAPI = walletInfo?.user?.businessProfile?.useCustomMpesa === true;
                let updatedWallet = walletInfo;
                if (!isCustomAPI) {
                    updatedWallet = await prisma.wallet.update({
                        where: { id: transaction.recipientWalletId },
                        data: { balance: { increment: Number(amount) - Number(transaction.feeCharged || 0) } },
                        include: { user: { include: { businessProfile: true } } }
                    });
                }
                await prisma.sale.updateMany({
                    where: { transactionId: transaction.id },
                    data: {
                        paymentStatus: 'PAID',
                        amountPaid: Number(amount),
                        amountDue: 0
                    }
                });
                try {
                    const { NotificationDispatcher } = await Promise.resolve().then(() => __importStar(require('../services/notification-dispatcher.service')));
                    NotificationDispatcher.dispatch({
                        activity: 'PAYMENT_RECEIVED',
                        userId: updatedWallet?.userId || '',
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
                await prisma.sale.updateMany({
                    where: { transactionId: transaction.id },
                    data: { paymentStatus: 'FAILED' }
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
const manualCompleteMpesa = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { checkoutRequestId } = req.body;
        if (!checkoutRequestId) {
            res.status(400).json({ error: 'checkoutRequestId required' });
            return;
        }
        const transaction = await prisma.transaction.findFirst({
            where: { checkoutRequestId }
        });
        if (!transaction) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
        }
        const result = await prisma.$transaction(async (tx) => {
            const upTx = await tx.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: 'COMPLETED',
                    reference: transaction.reference?.startsWith('MANUAL') ? transaction.reference : `MANUAL-${Date.now()}`
                }
            });
            if (transaction.status !== 'COMPLETED' && upTx.type === 'DEPOSIT_STK') {
                const walletInfo = await tx.wallet.findUnique({
                    where: { id: upTx.recipientWalletId },
                    include: { user: { include: { businessProfile: true } } }
                });
                const isCustomAPI = walletInfo?.user?.businessProfile?.useCustomMpesa === true;
                if (!isCustomAPI) {
                    await tx.wallet.update({
                        where: { id: upTx.recipientWalletId },
                        data: {
                            balance: {
                                increment: upTx.amount
                            }
                        }
                    });
                }
            }
            let linkedSale = await tx.sale.findFirst({
                where: { transactionId: transaction.id },
                include: {
                    items: {
                        include: { product: true }
                    }
                }
            });
            if (linkedSale) {
                linkedSale = await tx.sale.update({
                    where: { id: linkedSale.id },
                    data: {
                        paymentStatus: 'PAID',
                        amountPaid: upTx.amount,
                        amountDue: 0
                    },
                    include: {
                        items: {
                            include: { product: true }
                        }
                    }
                });
            }
            return { upTx, linkedSale };
        });
        res.json({
            success: true,
            transactionId: result.upTx.id,
            sale: result.linkedSale
        });
    }
    catch (error) {
        console.error('Manual complete error:', error);
        res.status(500).json({ error: 'Failed to manually complete payment' });
    }
};
exports.manualCompleteMpesa = manualCompleteMpesa;
const getMpesaStatus = async (req, res) => {
    try {
        const checkoutRequestId = req.params.checkoutRequestId || req.query.checkoutRequestId;
        if (!checkoutRequestId) {
            res.status(400).json({ error: 'checkoutRequestId is required' });
            return;
        }
        const transaction = await prisma.transaction.findFirst({
            where: { checkoutRequestId },
            include: {
                sale: {
                    include: {
                        items: {
                            include: { product: true }
                        }
                    }
                }
            }
        });
        if (!transaction) {
            res.status(404).json({ error: 'Transaction not found for this checkoutRequestId' });
            return;
        }
        if (transaction.status === 'COMPLETED') {
            let sale = transaction.sale;
            if (sale && sale.paymentStatus !== 'PAID') {
                sale = await prisma.sale.update({
                    where: { id: sale.id },
                    data: {
                        paymentStatus: 'PAID',
                        amountPaid: transaction.amount,
                        amountDue: 0
                    },
                    include: {
                        items: {
                            include: { product: true }
                        }
                    }
                });
            }
            res.json({
                status: 'COMPLETED',
                transaction,
                sale
            });
            return;
        }
        if (transaction.status === 'FAILED') {
            res.json({
                status: 'FAILED',
                transaction,
                sale: transaction.sale
            });
            return;
        }
        try {
            const queryRes = await (0, mpesa_service_1.querySTKPushStatus)(checkoutRequestId, transaction.initiatorUserId);
            if (queryRes.success && queryRes.data) {
                const resultCode = String(queryRes.data.ResultCode);
                if (resultCode === '0') {
                    const receipt = queryRes.data.MpesaReceiptNumber || transaction.reference;
                    const resolved = await prisma.$transaction(async (tx) => {
                        const upTx = await tx.transaction.update({
                            where: { id: transaction.id },
                            data: {
                                status: 'COMPLETED',
                                reference: receipt
                            }
                        });
                        await tx.wallet.update({
                            where: { id: transaction.recipientWalletId },
                            data: { balance: { increment: Number(transaction.amount) - Number(transaction.feeCharged || 0) } }
                        });
                        let sale = await tx.sale.findFirst({
                            where: { transactionId: transaction.id },
                            include: { items: { include: { product: true } } }
                        });
                        if (sale) {
                            sale = await tx.sale.update({
                                where: { id: sale.id },
                                data: {
                                    paymentStatus: 'PAID',
                                    amountPaid: transaction.amount,
                                    amountDue: 0
                                },
                                include: { items: { include: { product: true } } }
                            });
                        }
                        return { upTx, sale };
                    });
                    res.json({
                        status: 'COMPLETED',
                        confirmedBySafaricom: true,
                        transaction: resolved.upTx,
                        sale: resolved.sale
                    });
                    return;
                }
                else if (resultCode === '1032' || resultCode === '1') {
                    await prisma.transaction.update({
                        where: { id: transaction.id },
                        data: { status: 'FAILED' }
                    });
                    await prisma.sale.updateMany({
                        where: { transactionId: transaction.id },
                        data: { paymentStatus: 'FAILED' }
                    });
                    res.json({
                        status: 'FAILED',
                        message: queryRes.data.ResultDesc || 'Payment was cancelled on phone',
                        transaction
                    });
                    return;
                }
            }
        }
        catch (queryErr) {
            console.error('Active Daraja status query error:', queryErr);
        }
        res.json({
            status: 'PENDING',
            transaction,
            sale: transaction.sale
        });
    }
    catch (error) {
        console.error('getMpesaStatus Error:', error);
        res.status(500).json({ error: 'Failed to retrieve payment status' });
    }
};
exports.getMpesaStatus = getMpesaStatus;
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
const generateQrCode = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.merchantId || req.user.userId;
        const { refNo, amount, trxCode, merchantName, cpi, size } = req.body;
        if (!refNo) {
            res.status(400).json({ error: 'Reference number / item name (refNo) is required' });
            return;
        }
        const parsedAmount = Number(amount) || 1;
        const result = await (0, mpesa_service_1.generateDynamicMpesaQrCode)(userId, {
            refNo: String(refNo),
            amount: parsedAmount,
            trxCode: trxCode || undefined,
            merchantName: merchantName || undefined,
            cpi: cpi || undefined,
            size: size ? String(size) : '300'
        });
        res.json(result);
    }
    catch (error) {
        console.error('generateQrCode Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate dynamic M-Pesa QR code' });
    }
};
exports.generateQrCode = generateQrCode;
const generateProductQrCode = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.merchantId || req.user.userId;
        const { id } = req.params;
        const product = await prisma.product.findFirst({
            where: {
                id,
                merchantId: userId
            }
        });
        if (!product) {
            res.status(404).json({ error: 'Product not found or not owned by merchant' });
            return;
        }
        const { trxCode, size } = req.query;
        const result = await (0, mpesa_service_1.generateDynamicMpesaQrCode)(userId, {
            refNo: product.name.slice(0, 20),
            amount: Number(product.price) || 1,
            trxCode: trxCode || undefined,
            size: size ? String(size) : '300'
        });
        res.json({
            ...result,
            product: {
                id: product.id,
                name: product.name,
                price: Number(product.price),
                sku: product.sku,
                imageUrl: product.imageUrl
            }
        });
    }
    catch (error) {
        console.error('generateProductQrCode Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate product M-Pesa QR code' });
    }
};
exports.generateProductQrCode = generateProductQrCode;
//# sourceMappingURL=mpesa.controller.js.map