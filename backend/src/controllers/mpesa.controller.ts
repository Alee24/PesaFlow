
import { Request, Response } from 'express';
import { initiateSTKPush, initiateB2CPayment, testMpesaConnectionService, querySTKPushStatus } from '../services/mpesa.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
        merchantId?: string;
    };
}

export const stkPush = async (req: AuthRequest, res: Response): Promise<void> => {
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
        const response = await initiateSTKPush(phoneNumber, Number(amount), 'POS Sale', req.user.userId, items, undefined, saleId);
        console.log('STK Initiation Successful:', response);
        res.json(response);

    } catch (error: any) {
        console.error('STK Push Controller Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

export const mpesaCallback = async (req: Request, res: Response): Promise<void> => {
    console.log('M-Pesa Callback Received:', JSON.stringify(req.body, null, 2));

    try {
        // Handle STK Push Callbacks
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
                // Success logic for STK
                const metaItems = stkCallback.CallbackMetadata?.Item || [];
                const receipt = metaItems.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value;
                const amount = metaItems.find((i: any) => i.Name === 'Amount')?.Value || transaction.amount;

                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { status: 'COMPLETED', reference: receipt || transaction.reference }
                });

                const updatedWallet = await prisma.wallet.update({
                    where: { id: transaction.recipientWalletId },
                    data: { balance: { increment: Number(amount) - Number(transaction.feeCharged || 0) } }
                });

                // Automatically update linked Sale record to PAID
                await prisma.sale.updateMany({
                    where: { transactionId: transaction.id },
                    data: {
                        paymentStatus: 'PAID',
                        amountPaid: Number(amount),
                        amountDue: 0
                    }
                });

                // Dispatch Email & SMS Notification to Merchant & Admin
                try {
                    const { NotificationDispatcher } = await import('../services/notification-dispatcher.service');
                    NotificationDispatcher.dispatch({
                        activity: 'PAYMENT_RECEIVED',
                        userId: updatedWallet.userId,
                        amount: Number(amount),
                        reference: receipt,
                        title: 'M-Pesa Payment Received',
                        message: `Payment of KES ${Number(amount).toLocaleString()} confirmed via M-Pesa STK Push.`
                    });
                } catch (notifErr) {
                    console.error('Notification dispatch error:', notifErr);
                }
            } else if (transaction) {
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
        
        // Handle B2C (Bulk/Disbursement) Callbacks
        else if (req.body.Result) {
            const { Result } = req.body;
            const conversationID = Result.ConversationID;
            const originatorConversationID = Result.OriginatorConversationID;
            const resultCode = Result.ResultCode;

            console.log(`[M-Pesa B2C] Callback for ConversationID: ${conversationID}, ResultCode: ${resultCode}`);

            // Find by ConversationID or OriginatorConversationID
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
                    const receipt = Result.ResultParameters?.ResultParameter?.find((p: any) => p.Key === 'TransactionID')?.Value;
                    await prisma.transaction.update({
                        where: { id: transaction.id },
                        data: { 
                            status: 'COMPLETED',
                            reference: receipt || transaction.reference
                        }
                    });

                    // Decrement balance on completion
                    await prisma.wallet.update({
                        where: { id: transaction.recipientWalletId },
                        data: { balance: { decrement: Number(transaction.amount) } }
                    });
                    
                    console.log(`✅ B2C Disbursement Successful: ${transaction.id}`);
                } else {
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
    } catch (error) {
        console.error('Callback Error', error);
        res.status(500).json({ error: 'Callback processing failed' });
    }
};

export const initiateInvoicePayment = async (req: AuthRequest, res: Response): Promise<void> => {
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
        const response = await initiateSTKPush(
            phoneNumber,
            Number(invoice.amount),
            `Inv ${invoice.reference || 'Ref'}`,
            req.user.userId,
            [],
            invoiceId
        );

        res.json(response);

    } catch (error: any) {
        console.error('Invoice Payment Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

export const bulkProcess = async (req: AuthRequest, res: Response): Promise<void> => {
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
                const result = await initiateB2CPayment(
                    payment.phoneNumber,
                    Number(payment.amount),
                    payment.reference || `Bulk-${Date.now()}`,
                    userId,
                    payment.description || 'Mpesa Connect Bulk Payment'
                );
                results.push({ phone: payment.phoneNumber, status: 'SUCCESS' });
            } catch (err: any) {
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
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const manualCompleteMpesa = async (req: AuthRequest, res: Response): Promise<void> => {
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

        // Manually complete the transaction and resolve linked sale
        const result = await prisma.$transaction(async (tx) => {
            const upTx = await tx.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: 'COMPLETED',
                    reference: transaction.reference?.startsWith('MANUAL') ? transaction.reference : `MANUAL-${Date.now()}`
                }
            });

            // Update wallet balance for DEPOSIT_STK if not already completed
            if (transaction.status !== 'COMPLETED' && upTx.type === 'DEPOSIT_STK') {
                await tx.wallet.update({
                    where: { id: upTx.recipientWalletId },
                    data: {
                        balance: {
                            increment: upTx.amount
                        }
                    }
                });
            }

            // Mark linked sale as PAID
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
    } catch (error: any) {
        console.error('Manual complete error:', error);
        res.status(500).json({ error: 'Failed to manually complete payment' });
    }
};

export const getMpesaStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const checkoutRequestId = req.params.checkoutRequestId || (req.query.checkoutRequestId as string);
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

        // If already completed in DB, ensure linked sale is marked PAID and return
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

        // If PENDING, actively query Safaricom's Daraja Query API
        try {
            const queryRes = await querySTKPushStatus(checkoutRequestId, transaction.initiatorUserId);
            if (queryRes.success && queryRes.data) {
                const resultCode = String(queryRes.data.ResultCode);
                if (resultCode === '0') {
                    // Confirmed payment received by Safaricom!
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
                } else if (resultCode === '1032' || resultCode === '1') {
                    // Cancelled by user or failed
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
        } catch (queryErr) {
            console.error('Active Daraja status query error:', queryErr);
        }

        // Return current pending state
        res.json({
            status: 'PENDING',
            transaction,
            sale: transaction.sale
        });

    } catch (error) {
        console.error('getMpesaStatus Error:', error);
        res.status(500).json({ error: 'Failed to retrieve payment status' });
    }
};


export const testConnection = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    const { consumerKey, consumerSecret, env } = req.body;
    
    let providedCreds;
    if (consumerKey && consumerSecret) {
        providedCreds = { consumerKey, consumerSecret, env: env || 'sandbox' };
    }

    const result = await testMpesaConnectionService(userId, providedCreds);
    if (result.success) {
        res.json(result);
    } else {
        res.status(500).json(result);
    }
};

export const resetMpesaConfig = async (req: AuthRequest, res: Response): Promise<void> => {
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
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to reset settings' });
    }
};
