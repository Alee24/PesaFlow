"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const verifyMpesa = async () => {
    console.log('--- M-Pesa Credential Verification ---\n');
    const key = process.env.MPESA_CONSUMER_KEY;
    const secret = process.env.MPESA_CONSUMER_SECRET;
    const env = process.env.MPESA_ENV;
    const shortcode = process.env.MPESA_SHORTCODE;
    console.log(`Environment: ${env}`);
    console.log(`Consumer Key: ${key ? key.substring(0, 4) + '...' : 'MISSING'}`);
    console.log(`Consumer Secret: ${secret ? secret.substring(0, 4) + '...' : 'MISSING'}`);
    console.log(`Shortcode: ${shortcode || 'MISSING'}`);
    if (!key || !secret) {
        console.error('\n❌ Error: Missing API Keys in .env file.');
        process.exit(1);
    }
    const url = env === 'production'
        ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
        : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    console.log(`\nAttempting to connect to: ${url}...`);
    try {
        const auth = Buffer.from(`${key}:${secret}`).toString('base64');
        const response = await axios_1.default.get(url, {
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });
        console.log('\n✅ SUCCESS! Connection Established.');
        console.log(`Access Token received: ${response.data.access_token.substring(0, 10)}...`);
        console.log('Expires in: ' + response.data.expires_in + ' seconds');
    }
    catch (error) {
        console.error('\n❌ FAILED to authenticate.');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, error.response.data);
        }
        else {
            console.error(error.message);
        }
    }
};
verifyMpesa();
//# sourceMappingURL=verify-mpesa.js.map
