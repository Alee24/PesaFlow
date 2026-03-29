
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
        const { Body } = req.body;
        const { stkCallback } = Body;

        const merchantRequestID = stkCallback.MerchantRequestID;
        const resultCode = stkCallback.ResultCode;
        const checkoutRequestID = stkCallback.CheckoutRequestID;

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
                // Fetch service charge settings
                let fee = 2.5; 
                try {
                    const settings = await prisma.systemSettings.findFirst();
                    if (settings) {
                        fee = settings.serviceChargeEnabled ? Number(settings.serviceChargeAmount) : 0;
                    }
                } catch (settingsError) {
                    console.warn('   ⚠️ Could not fetch settings, using default fee');
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

                // Update associated sale to PAID
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
            }
        } else {
            // Payment Failed logic can go here (simplified)
            console.log(`❌ Payment Failed - ResultCode: ${resultCode}`);
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
                    payment.description || 'PesaFlow Bulk Payment'
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
