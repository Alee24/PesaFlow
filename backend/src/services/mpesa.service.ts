
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getCredentials = async (userId?: string) => {
    let creds = {
        consumerKey: '',
        consumerSecret: '',
        passkey: '',
        shortCode: '',
        initiatorName: '',
        password: '',
        callbackUrl: '',
        env: 'sandbox'
    };

    if (userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { businessProfile: true }
        });

        if (user && user.role === 'MERCHANT') {
            const profile = user.businessProfile;
            if (!profile || !profile.mpesaConsumerKey || !profile.mpesaConsumerSecret) {
                throw new Error('Please set up your own M-Pesa API credentials in Settings -> Business Profile to accept payments via STK push.');
            }
            console.log(`[M-Pesa] Merchant ${userId} using OWN API credentials`);
            creds.consumerKey = profile.mpesaConsumerKey || '';
            creds.consumerSecret = profile.mpesaConsumerSecret || '';
            creds.passkey = profile.mpesaPasskey || '';
            creds.shortCode = profile.mpesaShortcode || '';
            creds.initiatorName = profile.mpesaInitiatorName || '';
            creds.password = profile.mpesaInitiatorPass || '';
            creds.callbackUrl = profile.mpesaCallbackUrl || '';
            creds.env = profile.mpesaEnv || 'sandbox';
        } else {
            creds.consumerKey = process.env.MPESA_CONSUMER_KEY || '';
            creds.consumerSecret = process.env.MPESA_CONSUMER_SECRET || '';
            creds.passkey = process.env.MPESA_PASSKEY || '';
            creds.shortCode = process.env.MPESA_SHORTCODE || '';
            creds.initiatorName = process.env.MPESA_INITIATOR_NAME || '';
            creds.password = process.env.MPESA_INITIATOR_PASSWORD || '';
            creds.callbackUrl = process.env.MPESA_CALLBACK_URL || '';
            creds.env = process.env.MPESA_ENV || 'sandbox';
        }
    } else {
        creds.consumerKey = process.env.MPESA_CONSUMER_KEY || '';
        creds.consumerSecret = process.env.MPESA_CONSUMER_SECRET || '';
        creds.passkey = process.env.MPESA_PASSKEY || '';
        creds.shortCode = process.env.MPESA_SHORTCODE || '';
        creds.initiatorName = process.env.MPESA_INITIATOR_NAME || '';
        creds.password = process.env.MPESA_INITIATOR_PASSWORD || '';
        creds.callbackUrl = process.env.MPESA_CALLBACK_URL || '';
        creds.env = process.env.MPESA_ENV || 'sandbox';
    }

    creds.consumerKey = creds.consumerKey?.trim();
    creds.consumerSecret = creds.consumerSecret?.trim();
    creds.passkey = creds.passkey?.trim();
    creds.shortCode = creds.shortCode?.trim();
    creds.initiatorName = creds.initiatorName?.trim();
    creds.password = creds.password?.trim();
    creds.callbackUrl = creds.callbackUrl?.trim();
    creds.env = creds.env?.trim().toLowerCase();

    console.log(`[M-Pesa Config] Key: ${creds.consumerKey?.substring(0, 5)}... ShortCode: ${creds.shortCode} Env: ${creds.env}`);
    return creds;
}

const getAccessToken = async (creds: any) => {
    if (!creds.consumerKey || !creds.consumerSecret) {
        throw new Error('Missing Consumer Key or Secret');
    }

    // Normalize env to lowercase
    const env = (creds.env || 'sandbox').trim().toLowerCase();

    const url = env === 'production'
        ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
        : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

    const auth = Buffer.from(`${creds.consumerKey}:${creds.consumerSecret}`).toString('base64');

    console.log(`[M-Pesa Token] Environment: ${env}, URL: ${url}`);

    try {
        const response = await axios.get(url, {
            headers: { Authorization: `Basic ${auth}` },
            timeout: 10000 // 10 second timeout
        });
        return response.data.access_token;
    } catch (error: any) {
        const statusCode = error.response?.status;
        const safaricomMsg = error.response?.data?.errorMessage || error.response?.data?.error_description || error.response?.data?.error || error.message;
        console.error(`[M-Pesa Token ERROR] Status: ${statusCode}, Env: ${env}, Msg: ${safaricomMsg}`);
        
        // Helpful hint for 400 errors
        if (statusCode === 400) {
            throw new Error(`Token Error: Invalid credentials for ${env} environment. Please verify your Consumer Key and Secret are correct for ${env === 'production' ? 'Production (Live)' : 'Sandbox'} and have no extra spaces.`);
        }
        throw new Error(`Token Error: ${safaricomMsg}`);
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

export const initiateB2CPayment = async (
    phoneNumber: string,
    amount: number,
    reference: string,
    userId: string,
    description: string = 'Bulk Payment'
) => {
    const creds = await getCredentials(userId);
    const token = await getAccessToken(creds);

    const url = creds.env === 'production'
        ? 'https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest'
        : 'https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest';

    const formattedPhone = phoneNumber.startsWith('0')
        ? `254${phoneNumber.slice(1)}`
        : phoneNumber;

    const requestBody = {
        InitiatorName: creds.initiatorName,
        SecurityCredential: creds.password, // M-Pesa Initiator Password (Security Credential)
        CommandID: 'BusinessPayment',
        Amount: amount,
        PartyA: creds.shortCode,
        PartyB: formattedPhone,
        Remarks: description,
        QueueTimeOutURL: creds.callbackUrl,
        ResultURL: creds.callbackUrl,
        Occasion: reference
    };

    try {
        const response = await axios.post(url, requestBody, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        // Record the disbursement in Transactions
        const wallet = await prisma.wallet.findFirst({ where: { userId } });
        if (!wallet) throw new Error("Wallet not found for user");

        await prisma.transaction.create({
            data: {
                type: 'WITHDRAWAL', // Using WITHDRAWAL as type for sent money
                amount: amount,
                reference: reference,
                merchantRequestId: response.data.ConversationID || response.data.OriginatorConversationID,
                checkoutRequestId: response.data.ResponseCode,
                initiatorUserId: userId,
                recipientWalletId: wallet.id,
                status: 'PENDING',
                metadata: JSON.stringify(response.data)
            }
        });

        return response.data;
    } catch (error: any) {
        console.error('B2C Payment Error:', error.response?.data || error.message);
        const safaricomError = error.response?.data?.errorMessage || error.message;
        throw new Error(safaricomError || 'Failed to initiate B2C Payment');
    }
};
