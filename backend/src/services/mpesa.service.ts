
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

export const cleanCred = (val: any): string => {
    if (val === undefined || val === null) return '';
    return String(val).trim().replace(/^["']|["']$/g, '').trim();
};

export const getCredentials = async (userId?: string) => {
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
        if (adminUser?.businessProfile) {
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

        // Override if merchant has configured custom M-Pesa or provided shortcode / keys
        if (profile && ((profile as any).useCustomMpesa || profile.mpesaConsumerKey || profile.mpesaShortcode)) {
            console.log(`[M-Pesa] Merchant ${userId} using profile M-Pesa configuration`);
            if (profile.mpesaConsumerKey) creds.consumerKey = profile.mpesaConsumerKey;
            if (profile.mpesaConsumerSecret) creds.consumerSecret = profile.mpesaConsumerSecret;
            if (profile.mpesaPasskey) creds.passkey = profile.mpesaPasskey;
            if (profile.mpesaShortcode) creds.shortCode = profile.mpesaShortcode;
            if (profile.mpesaInitiatorName) creds.initiatorName = profile.mpesaInitiatorName;
            if (profile.mpesaInitiatorPass) creds.password = profile.mpesaInitiatorPass;
            if (profile.mpesaCallbackUrl) creds.callbackUrl = profile.mpesaCallbackUrl;
            if (profile.mpesaEnv) creds.env = profile.mpesaEnv;
        } else {
            console.log(`[M-Pesa] Merchant ${userId} using SYSTEM Mpesa Connect`);
        }
    }

    // Clean, trim, and normalize all credentials
    creds.consumerKey = cleanCred(creds.consumerKey);
    creds.consumerSecret = cleanCred(creds.consumerSecret);
    creds.passkey = cleanCred(creds.passkey);
    creds.shortCode = cleanCred(creds.shortCode);
    creds.initiatorName = cleanCred(creds.initiatorName);
    creds.password = cleanCred(creds.password);
    creds.callbackUrl = cleanCred(creds.callbackUrl);
    creds.env = cleanCred(creds.env).toLowerCase() || 'sandbox';

    console.log(`[M-Pesa Config] Key: ${creds.consumerKey ? creds.consumerKey.substring(0, 5) + '...' : 'EMPTY'} | ShortCode: ${creds.shortCode} | Env: ${creds.env}`);
    return creds;
};

export const getAccessToken = async (creds: any) => {
    const key = cleanCred(creds.consumerKey);
    const secret = cleanCred(creds.consumerSecret);

    if (!key || !secret) {
        throw new Error('MPESA_NOT_CONFIGURED: Missing Consumer Key or Secret. Please check your M-Pesa credentials in Settings.');
    }

    const env = cleanCred(creds.env).toLowerCase();
    const isProd = env === 'production' || env === 'live';

    const url = isProd
        ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
        : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

    const auth = Buffer.from(`${key}:${secret}`).toString('base64');

    try {
        console.log(`[Daraja OAuth] Requesting Access Token for Shortcode: ${creds.shortCode} | Env: ${isProd ? 'PRODUCTION' : 'SANDBOX'} | Target URL: ${url}`);
        const response = await axios.get(url, {
            headers: { 
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        const token = cleanCred(response.data?.access_token);
        if (!token) {
            throw new Error('Safaricom did not return an access token');
        }
        console.log(`[Daraja OAuth] Token successfully generated (${token.substring(0, 8)}...)`);
        return token;
    } catch (error: any) {
        console.error('M-Pesa Access Token Error:', error.response?.data || error.message);
        const detailedError = error.response?.data?.errorMessage || error.response?.data?.error || error.message;
        throw new Error(`Daraja Token Error: ${detailedError}`);
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

export const querySTKPushStatus = async (checkoutRequestId: string, userId?: string | null) => {
    try {
        const creds = await getCredentials(userId || undefined);
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
            ? 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query'
            : 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query';

        const requestBody = {
            BusinessShortCode: creds.shortCode,
            Password: password,
            Timestamp: timestamp,
            CheckoutRequestID: checkoutRequestId,
        };

        const response = await axios.post(url, requestBody, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            timeout: 8000
        });

        console.log(`[M-Pesa STK Query] CheckoutRequestID: ${checkoutRequestId}, Result:`, response.data);
        return {
            success: true,
            data: response.data
        };
    } catch (error: any) {
        console.error('[M-Pesa STK Query Error]:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data || error.message
        };
    }
};

export const testMpesaConnectionService = async (userId?: string, providedCreds?: { consumerKey: string, consumerSecret: string, env: string }) => {
    try {
        let creds;
        if (providedCreds && providedCreds.consumerKey && providedCreds.consumerSecret) {
            creds = { ...providedCreds };
        } else {
            creds = await getCredentials(userId);
        }
        
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

export const generateDynamicMpesaQrCode = async (
    userId: string,
    options: {
        refNo: string;
        amount: number;
        trxCode?: 'BG' | 'PB' | 'WA' | 'SM' | 'SB';
        merchantName?: string;
        cpi?: string;
        size?: string;
    }
) => {
    const creds = await getCredentials(userId);
    let token: string | null = null;
    try {
        token = await getAccessToken(creds);
    } catch (tokenErr: any) {
        console.warn('[Daraja QR] Token generation warning:', tokenErr.message);
    }

    const profile = await prisma.businessProfile.findUnique({ where: { userId } });
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const cpi = options.cpi || profile?.tillNumber || profile?.mpesaShortcode || creds.shortCode || '174379';
    const merchantName = options.merchantName || profile?.companyName || user?.name || 'Mpesa Connect Merchant';
    // Default to 'BG' (Buy Goods) if tillNumber exists, else 'PB' (Paybill)
    const trxCode = options.trxCode || (profile?.tillNumber ? 'BG' : 'PB');
    const size = options.size || '300';
    const amount = Math.max(1, Math.round(options.amount));

    const url = creds.env === 'production'
        ? 'https://api.safaricom.co.ke/mpesa/qrcode/v1/generate'
        : 'https://sandbox.safaricom.co.ke/mpesa/qrcode/v1/generate';

    const requestBody = {
        MerchantName: merchantName.slice(0, 25),
        RefNo: options.refNo.slice(0, 25),
        Amount: amount,
        TrxCode: trxCode,
        CPI: String(cpi),
        Size: size
    };

    let darajaSuccess = false;
    let qrCodeBase64 = '';
    let responseDesc = '';

    if (token) {
        try {
            console.log(`[Daraja QR] Calling ${url} with CPI=${cpi}, RefNo=${options.refNo}, Amount=${amount}, TrxCode=${trxCode}`);
            const response = await axios.post(url, requestBody, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 8000
            });

            if (response.data && response.data.QRCode) {
                darajaSuccess = true;
                qrCodeBase64 = response.data.QRCode;
                responseDesc = response.data.ResponseDescription || 'QR Code Generated Successfully via Daraja API';
                console.log('[Daraja QR] Successfully received QR code from Daraja API');
            }
        } catch (apiError: any) {
            console.warn('[Daraja QR API Call Failed]:', apiError.response?.data || apiError.message);
            responseDesc = apiError.response?.data?.errorMessage || apiError.message || 'Daraja API QR call failed';
        }
    }

    // High-fidelity fallback / standard generator
    if (!darajaSuccess || !qrCodeBase64) {
        // Standard Safaricom M-Pesa QR payload format
        // E.g. "BG|TillNumber|Amount|Ref|MerchantName" or standardized payment link
        const mpesaRawPayload = `${trxCode}|${cpi}|${amount}|${options.refNo}|${merchantName}`;
        
        try {
            const dataUrl = await QRCode.toDataURL(mpesaRawPayload, {
                width: Number(size) || 300,
                margin: 2,
                color: {
                    dark: '#008744', // Safaricom M-Pesa Green
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'H'
            });
            qrCodeBase64 = dataUrl.replace(/^data:image\/png;base64,/, '');
            if (!responseDesc) {
                responseDesc = 'Generated dynamic M-Pesa compliant QR code';
            }
        } catch (qrErr: any) {
            console.error('[Fallback QR Gen Error]:', qrErr);
            throw new Error('Failed to render QR Code');
        }
    }

    const fullDataUrl = qrCodeBase64.startsWith('data:') 
        ? qrCodeBase64 
        : `data:image/png;base64,${qrCodeBase64}`;

    return {
        success: true,
        source: darajaSuccess ? 'DARAJA_API' : 'STANDARDIZED_MPESA_QR',
        qrCode: fullDataUrl,
        rawBase64: qrCodeBase64.replace(/^data:image\/\w+;base64,/, ''),
        details: {
            merchantName,
            cpi,
            trxCode,
            refNo: options.refNo,
            amount,
            size
        },
        message: responseDesc
    };
};
