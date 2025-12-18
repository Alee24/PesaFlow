
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

        const { phoneNumber, amount, items } = req.body;

        if (!phoneNumber || !amount) {
            res.status(400).json({ error: 'Phone number and amount required' });
            return;
        }

        console.log(`Initiating STK Push for ${phoneNumber} amount ${amount}`);
        const response = await initiateSTKPush(phoneNumber, Number(amount), 'POS Sale', req.user.userId, items);
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
            // Success
            const metaItems = stkCallback.CallbackMetadata.Item;
            const amountItem = metaItems.find((i: any) => i.Name === 'Amount');
            const receiptItem = metaItems.find((i: any) => i.Name === 'MpesaReceiptNumber');
            const phoneNumberItem = metaItems.find((i: any) => i.Name === 'PhoneNumber');

            const amount = amountItem?.Value;
            const mpesaReceipt = receiptItem?.Value;
            const phone = phoneNumberItem?.Value;

            console.log(`Payment Success: ${mpesaReceipt} of KES ${amount}`);

            // Update transaction
            const transaction = await prisma.transaction.findFirst({
                where: { merchantRequestId: merchantRequestID }
            });

            if (transaction) {
                // Update transaction status
                // Credit Merchant Wallet (Amount - Fee)
                // Service Charge: 2.5 KES
                const fee = 2.5;
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

                console.log(`Credited wallet ${transaction.recipientWalletId} with ${creditAmount}`);

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
            }

        } else {
            console.log(`Payment Failed: ${stkCallback.ResultDesc}`);
            // Mark transaction as failed
            const transaction = await prisma.transaction.findFirst({
                where: { merchantRequestId: merchantRequestID }
            });

            if (transaction) {
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { status: 'FAILED' }
                });

                // Send Notification
                if (transaction.initiatorUserId) {
                    await prisma.notification.create({
                        data: {
                            userId: transaction.initiatorUserId,
                            title: 'Payment Failed',
                            message: `Transaction failed: ${stkCallback.ResultDesc}`,
                            type: 'error'
                        }
                    });
                }
            }
        }

        res.json({ result: 'ok' });
    } catch (error) {
        console.error('Callback Error', error);
        res.status(500).json({ error: 'Callback processing failed' });
    }
};

import { testMpesaConnectionService } from '../services/mpesa.service';

export const testConnection = async (req: Request, res: Response): Promise<void> => {
    const result = await testMpesaConnectionService();
    if (result.success) {
        res.json(result);
    } else {
        res.status(500).json(result);
    }
};
