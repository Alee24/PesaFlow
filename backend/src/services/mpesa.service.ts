
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getCredentials = async (userId?: string) => {
    let creds = {
        consumerKey: process.env.MPESA_CONSUMER_KEY,
        consumerSecret: process.env.MPESA_CONSUMER_SECRET,
        passkey: process.env.MPESA_PASSKEY,
        shortCode: process.env.MPESA_SHORTCODE,
        initiatorName: process.env.MPESA_INITIATOR_NAME,
        password: process.env.MPESA_INITIATOR_PASSWORD,
        callbackUrl: process.env.MPESA_CALLBACK_URL || 'http://localhost:3001/api/mpesa/callback',
        env: process.env.MPESA_ENV || 'sandbox'
    };

    if (userId) {
        const profile = await prisma.businessProfile.findUnique({ where: { userId } });
        if (profile) {
            if (profile.mpesaConsumerKey) creds.consumerKey = profile.mpesaConsumerKey;
            if (profile.mpesaConsumerSecret) creds.consumerSecret = profile.mpesaConsumerSecret;
            if (profile.mpesaPasskey) creds.passkey = profile.mpesaPasskey;
            if (profile.mpesaShortcode) creds.shortCode = profile.mpesaShortcode;
            if (profile.mpesaInitiatorName) creds.initiatorName = profile.mpesaInitiatorName;
            if (profile.mpesaInitiatorPass) creds.password = profile.mpesaInitiatorPass;
            if (profile.mpesaCallbackUrl) creds.callbackUrl = profile.mpesaCallbackUrl;
            if (profile.mpesaEnv) creds.env = profile.mpesaEnv;
        }
    }
    return creds;
}

const getAccessToken = async (creds: any) => {
    const url = creds.env === 'production'
        ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
        : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

    const auth = Buffer.from(`${creds.consumerKey}:${creds.consumerSecret}`).toString('base64');

    try {
        const response = await axios.get(url, {
            headers: { Authorization: `Basic ${auth}` },
        });
        return response.data.access_token;
    } catch (error: any) {
        console.error('M-Pesa Access Token Error:', error.message);
        throw new Error('Failed to get M-Pesa access token');
    }
};

export const initiateSTKPush = async (
    phoneNumber: string,
    amount: number,
    reference: string,
    userId: string,
    items: Array<{ name: string; price: number; quantity: number, id?: string }> = []
) => {
    const creds = await getCredentials(userId);
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

    // Ensure phone number format 254...
    const formattedPhone = phoneNumber.startsWith('0')
        ? `254${phoneNumber.slice(1)}`
        : phoneNumber;

    const requestBody = {
        BusinessShortCode: creds.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: creds.shortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: creds.callbackUrl,
        AccountReference: reference,
        TransactionDesc: `Payment for ${reference}`,
    };

    try {
        const response = await axios.post(url, requestBody, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        // Use interactive transaction to ensure data integrity
        await prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findFirstOrThrow({ where: { userId } });

            const transaction = await tx.transaction.create({
                data: {
                    type: 'DEPOSIT_STK',
                    amount: amount,
                    reference: reference, // This will be updated with actual MPesa Receipt in callback
                    merchantRequestId: response.data.MerchantRequestID,
                    checkoutRequestId: response.data.CheckoutRequestID,
                    initiatorUserId: userId,
                    recipientWalletId: wallet.id,
                    status: 'PENDING',
                    metadata: JSON.stringify(response.data)
                }
            });

            if (items.length > 0) {
                let defaultProduct = await tx.product.findFirst({ where: { merchantId: userId } });
                if (!defaultProduct) {
                    defaultProduct = await tx.product.create({
                        data: {
                            merchantId: userId,
                            name: 'General POS Item',
                            price: 0,
                            stockQuantity: 9999
                        }
                    });
                }

                await tx.sale.create({
                    data: {
                        merchantId: userId,
                        totalAmount: amount,
                        transactionId: transaction.id,
                        paymentMethod: 'MPESA_STK',
                        items: {
                            create: items.map(item => ({
                                productId: item.id || defaultProduct!.id,
                                quantity: item.quantity,
                                unitPrice: item.price,
                                subtotal: item.price * item.quantity
                            }))
                        }
                    }
                });

                for (const item of items) {
                    if (item.id) {
                        await tx.product.update({
                            where: { id: item.id },
                            data: { stockQuantity: { decrement: item.quantity } }
                        });
                    }
                }
            }
        });

        return { ...response.data, internalTransactionId: 'pending_lookup' };
    } catch (error: any) {
        console.error('STK Push Error:', error.response?.data || error.message);
        throw new Error('Failed to initiate STK Push');
    }
};

export const testMpesaConnectionService = async (userId?: string) => {
    try {
        const creds = await getCredentials(userId);
        if (!creds.consumerKey || !creds.consumerSecret) {
            throw new Error("Missing Consumer Key or Secret (Env or Settings)");
        }
        const token = await getAccessToken(creds);
        return { success: true, message: 'Connection successful. Access Token generated.', token: token.slice(0, 10) + '...' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
};
