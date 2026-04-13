"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
dotenv_1.default.config();
const testMpesaAuth = async () => {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    console.log('Testing M-Pesa Auth...');
    console.log(`Key: ${consumerKey}`);
    console.log(`Secret: ${consumerSecret}`);
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    try {
        const response = await axios_1.default.get(url, {
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });
        console.log('✅ Auth Success! Token:', response.data.access_token);
        return response.data.access_token;
    }
    catch (error) {
        console.error('❌ Auth Failed:', error.response?.data || error.message);
        return null;
    }
};
const testSTKPush = async (token) => {
    const shortCode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const url = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
    const date = new Date();
    const timestamp = date.getFullYear() +
        ('0' + (date.getMonth() + 1)).slice(-2) +
        ('0' + date.getDate()).slice(-2) +
        ('0' + date.getHours()).slice(-2) +
        ('0' + date.getMinutes()).slice(-2) +
        ('0' + date.getSeconds()).slice(-2);
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');
    const amount = 1;
    const phone = '254708374149';
    const callbackUrl = 'https://mydomain.com/path';
    const requestBody = {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phone,
        PartyB: shortCode,
        PhoneNumber: phone,
        CallBackURL: callbackUrl,
        AccountReference: 'Test POS',
        TransactionDesc: 'Test Payment'
    };
    console.log('Request Body:', JSON.stringify(requestBody, null, 2));
    try {
        console.log('Testing STK Push...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        const response = await axios_1.default.post(url, requestBody, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ STK Push Success!', response.data);
    }
    catch (error) {
        console.error('❌ STK Push Failed:', error.response?.data || error.message);
        if (error.response?.data?.requestId) {
            console.log('Request ID:', error.response.data.requestId);
        }
    }
};
const run = async () => {
    const token = await testMpesaAuth();
    if (token) {
        await testSTKPush(token);
    }
};
run();
//# sourceMappingURL=test-mpesa.js.map
