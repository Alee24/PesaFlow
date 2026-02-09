"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetMpesaConfig = exports.testConnection = exports.initiateInvoicePayment = exports.mpesaCallback = exports.stkPush = void 0;
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
        const { Body } = req.body;
        const { stkCallback } = Body;
        const merchantRequestID = stkCallback.MerchantRequestID;
        const resultCode = stkCallback.ResultCode;
        const checkoutRequestID = stkCallback.CheckoutRequestID;
        if (resultCode === 0) {
            const metaItems = stkCallback.CallbackMetadata.Item;
            const amountItem = metaItems.find((i) => i.Name === 'Amount');
            const receiptItem = metaItems.find((i) => i.Name === 'MpesaReceiptNumber');
            const phoneNumberItem = metaItems.find((i) => i.Name === 'PhoneNumber');
            const amount = amountItem?.Value;
            const mpesaReceipt = receiptItem?.Value;
            const phone = phoneNumberItem?.Value;
            console.log(`✅ Payment Success - MerchantRequestID: ${merchantRequestID}`);
            console.log(`   Receipt: ${mpesaReceipt}`);
            console.log(`   Amount: KES ${amount}`);
            console.log(`   Phone: ${phone}`);
            const transaction = await prisma.transaction.findFirst({
                where: { merchantRequestId: merchantRequestID }
            });
            if (transaction) {
                let fee = 2.5;
                try {
                    const settings = await prisma.systemSettings.findFirst();
                    if (settings) {
                        fee = settings.serviceChargeEnabled ? settings.serviceChargeAmount : 0;
                    }
                }
                catch (settingsError) {
                    console.warn('   ⚠️  Could not fetch service charge settings, using default:', settingsError);
                }
                const creditAmount = Number(amount) - fee;
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: 'COMPLETED',
                        reference: mpesaReceipt,
                        feeCharged: fee
                    }
                });
                await prisma.wallet.update({
                    where: { id: transaction.recipientWalletId },
                    data: {
                        balance: { increment: creditAmount }
                    }
                });
                console.log(`   Credited wallet ${transaction.recipientWalletId} with KES ${creditAmount}`);
                const sale = await prisma.sale.findFirst({
                    where: { transactionId: transaction.id }
                });
                if (sale) {
                    await prisma.sale.update({
                        where: { id: sale.id },
                        data: {
                            paymentStatus: 'PAID',
                            amountPaid: amount.toString()
                        }
                    });
                    console.log(`   Updated Sale ${sale.id} status to PAID`);
                    if (sale.customerId) {
                        await prisma.customer.update({
                            where: { id: sale.customerId },
                            data: {
                                totalPurchases: { increment: 1 },
                                lifetimeValue: { increment: Number(amount) },
                                lastPurchaseDate: new Date()
                            }
                        });
                    }
                }
                try {
                    if (transaction.metadata) {
                        const meta = JSON.parse(transaction.metadata);
                        if (meta.invoiceId) {
                            console.log(`   Marking linked invoice ${meta.invoiceId} as COMPLETED`);
                            await prisma.transaction.update({
                                where: { id: meta.invoiceId },
                                data: { status: 'COMPLETED' }
                            });
                            const invoiceSale = await prisma.sale.findFirst({
                                where: { transactionId: meta.invoiceId }
                            });
                            if (invoiceSale) {
                                await prisma.sale.update({
                                    where: { id: invoiceSale.id },
                                    data: {
                                        paymentStatus: 'PAID',
                                        amountPaid: invoiceSale.totalAmount,
                                        amountDue: 0
                                    }
                                });
                                console.log(`   Updated Invoice Sale ${invoiceSale.id} status to PAID`);
                                if (invoiceSale.customerId) {
                                    await prisma.customer.update({
                                        where: { id: invoiceSale.customerId },
                                        data: {
                                            totalPurchases: { increment: 1 },
                                            lifetimeValue: { increment: Number(invoiceSale.totalAmount) },
                                            lastPurchaseDate: new Date()
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
                catch (e) {
                    console.error("   Failed to parse metadata or update linked invoice", e);
                }
                if (transaction.initiatorUserId) {
                    await prisma.notification.create({
                        data: {
                            userId: transaction.initiatorUserId,
                            title: 'Payment Received',
                            message: `Received KES ${amount} from ${phone}. Ref: ${mpesaReceipt}`,
                            type: 'success'
                        }
                    });
                }
                console.log(`   Transaction ${transaction.id} marked as COMPLETED`);
            }
            else {
                console.error(`   ⚠️  No transaction found for MerchantRequestID: ${merchantRequestID}`);
            }
        }
        else {
            const failureReason = stkCallback.ResultDesc || 'Unknown error';
            console.log(`❌ Payment Failed - MerchantRequestID: ${merchantRequestID}`);
            console.log(`   Reason: ${failureReason}`);
            console.log(`   ResultCode: ${resultCode}`);
            const transaction = await prisma.transaction.findFirst({
                where: { merchantRequestId: merchantRequestID }
            });
            if (transaction) {
                const updatedMetadata = transaction.metadata ? JSON.parse(transaction.metadata) : {};
                updatedMetadata.failureReason = failureReason;
                updatedMetadata.failureCode = resultCode;
                updatedMetadata.failureTimestamp = new Date().toISOString();
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: 'FAILED',
                        metadata: JSON.stringify(updatedMetadata)
                    }
                });
                const sale = await prisma.sale.findFirst({
                    where: { transactionId: transaction.id }
                });
                if (sale) {
                    await prisma.sale.update({
                        where: { id: sale.id },
                        data: {
                            paymentStatus: 'FAILED',
                            notes: `Payment failed: ${failureReason}`
                        }
                    });
                    console.log(`   Updated Sale ${sale.id} status to FAILED`);
                }
                if (transaction.initiatorUserId) {
                    await prisma.notification.create({
                        data: {
                            userId: transaction.initiatorUserId,
                            title: 'Payment Failed',
                            message: `Transaction failed: ${failureReason}`,
                            type: 'error'
                        }
                    });
                }
                console.log(`   Transaction ${transaction.id} marked as FAILED`);
            }
            else {
                console.error(`   ⚠️  No transaction found for MerchantRequestID: ${merchantRequestID}`);
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
        const invoice = await prisma.transaction.findUnique({
            where: { id: invoiceId }
        });
        if (!invoice) {
            res.status(404).json({ error: 'Invoice not found' });
            return;
        }
        if (invoice.initiatorUserId !== req.user.userId) {
            res.status(403).json({ error: 'Unauthorized access to this invoice' });
            return;
        }
        if (invoice.status === 'COMPLETED') {
            res.status(400).json({ error: 'Invoice already paid' });
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
const mpesa_service_2 = require("../services/mpesa.service");
const testConnection = async (req, res) => {
    const userId = req.user?.userId;
    const result = await (0, mpesa_service_2.testMpesaConnectionService)(userId);
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
        console.log(`Resetting M-Pesa Config for user: ${userId}`);
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
        res.json({ success: true, message: 'Database M-Pesa settings cleared. System will now use .env variables.' });
    }
    catch (error) {
        console.error('Reset Config Error:', error);
        res.status(500).json({ error: 'Failed to reset settings' });
    }
};
exports.resetMpesaConfig = resetMpesaConfig;
//# sourceMappingURL=mpesa.controller.js.map