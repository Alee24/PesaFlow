
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
    userId: string,
    items: Array<{ name: string; price: number; quantity: number }> = []
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

            // If we have items, create a Sale record
            if (items.length > 0) {
                // Ensure product exists or create a placeholder if it's dynamic
                // For simplicity in this POS demo, we might need a "Miscellaneous" product
                // or we assume items match existing products.
                // To avoid complexity, we'll try to link if we have IDs, but here we just have name/price.
                // We'll create a Sale and SaleItems with a fallback product or find one.

                // NOTE: In a real app, items should have productIds.
                // We'll Create a "POS Item" product if it doesn't exist for this purpose, or map to a generic one.
                // Hack: Find ANY product to link constraints, or create one.

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
                                productId: defaultProduct!.id, // Linking to generic for now as we didn't pass IDs
                                quantity: item.quantity,
                                unitPrice: item.price,
                                subtotal: item.price * item.quantity
                            }))
                        }
                    }
                });
            }
        });

        return response.data;
    } catch (error: any) {
        console.error('STK Push Error:', error.response?.data || error.message);
        throw new Error('Failed to initiate STK Push');
    }
};
