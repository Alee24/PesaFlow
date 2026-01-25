
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getCredentials = async (userId?: string) => {
    // 1. Start with .env as baseline
    let creds = {
        consumerKey: process.env.MPESA_CONSUMER_KEY,
        consumerSecret: process.env.MPESA_CONSUMER_SECRET,
        passkey: process.env.MPESA_PASSKEY,
        shortCode: process.env.MPESA_SHORTCODE,
        initiatorName: process.env.MPESA_INITIATOR_NAME,
        password: process.env.MPESA_INITIATOR_PASSWORD,
        callbackUrl: process.env.MPESA_CALLBACK_URL || (process.env.APP_URL ? `${process.env.APP_URL}/api/mpesa/callback` : 'http://localhost:3001/api/mpesa/callback'),
        env: process.env.MPESA_ENV || 'sandbox'
    };

    // 2. Try to load System-wide Admin defaults if available in DB
    try {
        const adminUser = await prisma.user.findFirst({
            where: { role: 'ADMIN' },
            include: { businessProfile: true }
        });
        if (adminUser?.businessProfile && adminUser.businessProfile.mpesaConsumerKey) {
            const p = adminUser.businessProfile;
            if (p.mpesaConsumerKey) creds.consumerKey = p.mpesaConsumerKey;
            if (p.mpesaConsumerSecret) creds.consumerSecret = p.mpesaConsumerSecret;
            if (p.mpesaPasskey) creds.passkey = p.mpesaPasskey;
            if (p.mpesaShortcode) creds.shortCode = p.mpesaShortcode;
            if (p.mpesaInitiatorName) creds.initiatorName = p.mpesaInitiatorName;
            if (p.mpesaInitiatorPass) creds.password = p.mpesaInitiatorPass;
            if (p.mpesaCallbackUrl) creds.callbackUrl = p.mpesaCallbackUrl;
            if (p.mpesaEnv) creds.env = p.mpesaEnv;
            console.log('[M-Pesa] Loaded System Defaults from Admin Profile');
        }
    } catch (e) {
        console.warn('[M-Pesa] Failed to load System Defaults from DB, using ENV');
    }

    // 3. User Specific Override
    if (userId) {
        const profile = await prisma.businessProfile.findUnique({ where: { userId } });

        // ONLY override if user has explicitly enabled custom M-Pesa and has keys
        if (profile && (profile as any).useCustomMpesa && profile.mpesaConsumerKey) {
            console.log(`[M-Pesa] Merchant ${userId} using OWN API credentials`);
            creds.consumerKey = profile.mpesaConsumerKey || creds.consumerKey;
            creds.consumerSecret = profile.mpesaConsumerSecret || creds.consumerSecret;
            creds.passkey = profile.mpesaPasskey || creds.passkey;
            creds.shortCode = profile.mpesaShortcode || creds.shortCode;
            creds.initiatorName = profile.mpesaInitiatorName || creds.initiatorName;
            creds.password = profile.mpesaInitiatorPass || creds.password;
            creds.callbackUrl = profile.mpesaCallbackUrl || creds.callbackUrl;
            creds.env = profile.mpesaEnv || creds.env;
        } else {
            console.log(`[M-Pesa] Merchant ${userId} using SYSTEM Mpesa Connect`);
        }
    }

    console.log(`[M-Pesa Config] Key: ${creds.consumerKey?.substring(0, 5)}... ShortCode: ${creds.shortCode} Env: ${creds.env}`);
    return creds;
}

const getAccessToken = async (creds: any) => {
    if (!creds.consumerKey || !creds.consumerSecret) {
        throw new Error('Missing Consumer Key or Secret');
    }

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
        console.error('M-Pesa Access Token Error:', error.response?.data || error.message);
        const detailedError = error.response?.data?.errorMessage || error.response?.data?.error || error.message;
        throw new Error(`Token Error: ${detailedError}`);
    }
};

export const initiateSTKPush = async (
    phoneNumber: string,
    amount: number,
    reference: string,
    userId: string,
    items: Array<{ name: string; price: number; quantity: number, id?: string }> = [],
    invoiceId?: string,
    saleId?: string // Existing sale ID for retry
) => {
    const creds = await getCredentials(userId);
    console.log(`[M-Pesa Service] Using Environment: ${creds.env}`);
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
            let wallet = await tx.wallet.findFirst({ where: { userId } });

            if (!wallet) {
                console.log(`[STK Push] Creating missing wallet for user ${userId}`);
                wallet = await tx.wallet.create({
                    data: {
                        userId,
                        balance: 0
                    }
                });
            }

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
                    metadata: JSON.stringify({ ...response.data, invoiceId })
                }
            });

            if (items.length > 0 && !saleId) {
                // Only create new sale if this is not a retry (saleId not provided)
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
                        paymentStatus: 'PENDING', // Will be updated to PAID/FAILED by callback
                        customerPhone: phoneNumber,
                        amountPaid: 0, // Will be updated by callback
                        amountDue: amount,
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
            } else if (saleId) {
                // For retry: link transaction to existing sale
                await tx.sale.update({
                    where: { id: saleId },
                    data: {
                        transactionId: transaction.id,
                        paymentStatus: 'PENDING' // Reset to pending for retry
                    }
                });
                console.log(`[STK Push] Linked new transaction to existing sale ${saleId}`);
            }
        });

        return { ...response.data, internalTransactionId: 'pending_lookup' };
    } catch (error: any) {
        console.error('STK Push Error:', error.response?.data || error.message);
        const safaricomError = error.response?.data?.errorMessage || error.message;
        throw new Error(safaricomError || 'Failed to initiate STK Push');
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
