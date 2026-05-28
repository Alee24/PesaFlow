
import { Request, Response } from 'express';
import { initiateSTKPush, initiateB2CPayment, testMpesaConnectionService } from '../services/mpesa.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
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
            const resultCode = stkCallback.ResultCode;

            const transaction = await prisma.transaction.findFirst({
                where: { merchantRequestId: merchantRequestID }
            });

            if (transaction && resultCode === 0) {
                // Success logic for STK
                const metaItems = stkCallback.CallbackMetadata.Item;
                const receipt = metaItems.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value;
                const amount = metaItems.find((i: any) => i.Name === 'Amount')?.Value;

                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { status: 'COMPLETED', reference: receipt }
                });

                await prisma.wallet.update({
                    where: { id: transaction.recipientWalletId },
                    data: { balance: { increment: Number(amount) - Number(transaction.feeCharged) } }
                });
            } else if (transaction) {
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { status: 'FAILED' }
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

export const testConnection = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    const result = await testMpesaConnectionService(userId);
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
