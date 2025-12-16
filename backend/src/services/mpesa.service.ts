
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getAccessToken = async () => {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const url = process.env.MPESA_ENV === 'production'
        ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
        : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    try {
        console.log(`Getting Access Token from ${url}`);
        const response = await axios.get(url, {
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });
        console.log('Got Access Token');
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
    userId: string
) => {
    const token = await getAccessToken();
    const date = new Date();
    const timestamp = date.getFullYear() +
        ('0' + (date.getMonth() + 1)).slice(-2) +
        ('0' + date.getDate()).slice(-2) +
        ('0' + date.getHours()).slice(-2) +
        ('0' + date.getMinutes()).slice(-2) +
        ('0' + date.getSeconds()).slice(-2);

    const shortCode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

    const url = process.env.MPESA_ENV === 'production'
        ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
        : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    // Ensure phone number format 254...
    const formattedPhone = phoneNumber.startsWith('0')
        ? `254${phoneNumber.slice(1)}`
        : phoneNumber;

    const callbackUrl = process.env.MPESA_CALLBACK_URL || 'http://localhost:3001/api/mpesa/callback';

    const requestBody = {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: shortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackUrl,
        AccountReference: reference,
        TransactionDesc: `Payment for ${reference}`,
    };

    try {
        const response = await axios.post(url, requestBody, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        // Log intent to DB
        await prisma.transaction.create({
            data: {
                type: 'DEPOSIT_STK',
                amount: amount,
                reference: reference,
                merchantRequestId: response.data.MerchantRequestID,
                checkoutRequestId: response.data.CheckoutRequestID,
                initiatorUserId: userId,
                recipientWalletId: (await prisma.wallet.findFirstOrThrow({ where: { userId } })).id,
                status: 'PENDING',
                metadata: JSON.stringify(response.data)
            }
        });

        return response.data;
    } catch (error: any) {
        console.error('STK Push Error:', error.response?.data || error.message);
        throw new Error('Failed to initiate STK Push');
    }
};
