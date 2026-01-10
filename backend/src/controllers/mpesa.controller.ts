
import { Request, Response } from 'express';
import { initiateSTKPush } from '../services/mpesa.service';
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
        const { Body } = req.body;
        const { stkCallback } = Body;

        const merchantRequestID = stkCallback.MerchantRequestID;
        const resultCode = stkCallback.ResultCode;
        const checkoutRequestID = stkCallback.CheckoutRequestID;

        // Find the pending transaction via metadata logic (simplified here matching logic needed)
        // Since we stored the initial response metadata, we can match MerchantRequestID inside that JSON.
        // For strict SQL, we might want a dedicated field for merchantRequestId in the Transaction model.
        // But here we'll search via raw query or careful JSON filtering if using Postgres.
        // For SQLite dev, it's harder to query JSON. 

        // Strategy: Iterate pending transactions (inefficient but works for dev)
        // OR: Add merchantRequestID to Transaction Model. -> BETTER.

        if (resultCode === 0) {
            // Payment Success
            const metaItems = stkCallback.CallbackMetadata.Item;
            const amountItem = metaItems.find((i: any) => i.Name === 'Amount');
            const receiptItem = metaItems.find((i: any) => i.Name === 'MpesaReceiptNumber');
            const phoneNumberItem = metaItems.find((i: any) => i.Name === 'PhoneNumber');

            const amount = amountItem?.Value;
            const mpesaReceipt = receiptItem?.Value;
            const phone = phoneNumberItem?.Value;

            console.log(`✅ Payment Success - MerchantRequestID: ${merchantRequestID}`);
            console.log(`   Receipt: ${mpesaReceipt}`);
            console.log(`   Amount: KES ${amount}`);
            console.log(`   Phone: ${phone}`);

            // Update transaction
            const transaction = await prisma.transaction.findFirst({
                where: { merchantRequestId: merchantRequestID }
            });

            if (transaction) {
                // Fetch service charge settings with fallback
                let fee = 2.5; // Default service charge
                try {
                    const settings = await prisma.systemSettings.findFirst();
                    if (settings) {
                        fee = settings.serviceChargeEnabled ? settings.serviceChargeAmount : 0;
                    }
                } catch (settingsError) {
                    console.warn('   ⚠️  Could not fetch service charge settings, using default:', settingsError);
                    // Continue with default fee
                }

                const creditAmount = Number(amount) - fee;

                // Update transaction status & record fee
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

                // Update associated sale to PAID if exists
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
                }

                // Check for linked Invoice and update it
                try {
                    if (transaction.metadata) {
                        const meta = JSON.parse(transaction.metadata);
                        if (meta.invoiceId) {
                            console.log(`   Marking linked invoice ${meta.invoiceId} as COMPLETED`);
                            await prisma.transaction.update({
                                where: { id: meta.invoiceId },
                                data: { status: 'COMPLETED' }
                            });
                        }
                    }
                } catch (e) {
                    console.error("   Failed to parse metadata or update linked invoice", e);
                }

                // Send Notification
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
            } else {
                console.error(`   ⚠️  No transaction found for MerchantRequestID: ${merchantRequestID}`);
            }

        } else {
            // Payment Failed
            const failureReason = stkCallback.ResultDesc || 'Unknown error';
            console.log(`❌ Payment Failed - MerchantRequestID: ${merchantRequestID}`);
            console.log(`   Reason: ${failureReason}`);
            console.log(`   ResultCode: ${resultCode}`);

            // Mark transaction as failed
            const transaction = await prisma.transaction.findFirst({
                where: { merchantRequestId: merchantRequestID }
            });

            if (transaction) {
                // Update transaction with failure details
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

                // Update associated sale to FAILED if exists
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

                // Send Notification
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
            } else {
                console.error(`   ⚠️  No transaction found for MerchantRequestID: ${merchantRequestID}`);
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

        // Verify Invoice
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

import { testMpesaConnectionService } from '../services/mpesa.service';

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
    } catch (error: any) {
        console.error('Reset Config Error:', error);
        res.status(500).json({ error: 'Failed to reset settings' });
    }
};
