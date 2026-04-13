"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
dotenv_1.default.config();
const GENERIC_SHORTCODE = '174379';
const GENERIC_PASSKEY = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
const testMpesaAuth = async () => {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    try {
        const response = await axios_1.default.get(url, { headers: { Authorization: `Basic ${auth}` } });
        console.log('✅ Auth Success! Token:', response.data.access_token);
        return response.data.access_token;
    }
    catch (error) {
        console.error('❌ Auth Failed:', error.response?.data || error.message);
        return null;
    }
};
const testSTKPush = async (token) => {
    const url = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
    const date = new Date();
    const timestamp = date.getFullYear() +
        ('0' + (date.getMonth() + 1)).slice(-2) +
        ('0' + date.getDate()).slice(-2) +
        ('0' + date.getHours()).slice(-2) +
        ('0' + date.getMinutes()).slice(-2) +
        ('0' + date.getSeconds()).slice(-2);
    const password = Buffer.from(`${GENERIC_SHORTCODE}${GENERIC_PASSKEY}${timestamp}`).toString('base64');
    const requestBody = {
        BusinessShortCode: GENERIC_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: 1,
        PartyA: '254708374149',
        PartyB: GENERIC_SHORTCODE,
        PhoneNumber: '254708374149',
        CallBackURL: 'https://mydomain.com/path',
        AccountReference: 'Test POS',
        TransactionDesc: 'Test Payment'
    };
    try {
        console.log('Testing STK Push with GENERIC Credentials...');
        const response = await axios_1.default.post(url, requestBody, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ STK Push Success!', response.data);
    }
    catch (error) {
        console.error('❌ STK Push Failed:', error.response?.data || error.message);
    }
};
const run = async () => {
    const token = await testMpesaAuth();
    if (token) {
        await testSTKPush(token);
    }
};
run();
//# sourceMappingURL=test-mpesa-generic.js.map
