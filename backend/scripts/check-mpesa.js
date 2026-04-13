
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    console.log('--- M-Pesa DebugBot ---');
    console.log('[1] Checking Environment Variables...');

    // Check Env
    const envVars = [
        'MPESA_CONSUMER_KEY',
        'MPESA_CONSUMER_SECRET',
        'MPESA_PASSKEY',
        'MPESA_SHORTCODE',
        'MPESA_CALLBACK_URL'
    ];

    let missing = [];
    envVars.forEach(v => {
        if (!process.env[v]) {
            missing.push(v);
            console.log(`❌ Missing: ${v}`);
        } else {
            console.log(`✅ Present: ${v} = ${process.env[v].substring(0, 4)}...`);
        }
    });

    if (missing.length > 0) {
        console.error('\nStopping: Critical Environment Variables Missing.');
        return;
    }

    console.log('\n[2] Testing Safaricom Connection (OAuth)...');

    const creds = {
        consumerKey: process.env.MPESA_CONSUMER_KEY,
        consumerSecret: process.env.MPESA_CONSUMER_SECRET,
        env: process.env.MPESA_ENV || 'sandbox'
    };

    const auth = Buffer.from(`${creds.consumerKey}:${creds.consumerSecret}`).toString('base64');
    const url = creds.env === 'production'
        ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
        : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

    try {
        console.log(`Connecting to: ${url}`);
        const response = await axios.get(url, {
            headers: { Authorization: `Basic ${auth}` },
        });
        console.log('✅ Connection Successful!');
        console.log(`Access Token: ${response.data.access_token.substring(0, 15)}...`);
        console.log(`Expires in: ${response.data.expires_in} seconds`);
    } catch (error) {
        console.error('❌ Connection Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }

    }

    console.log('\n[3] Checking Database Settings (Optional Override)...');
    try {
        // Assuming testing for a specific user if needed, but for now just general check
        // You can add logic here if you want to test a specific user's DB overrides
        console.log('Skipping DB check (General System Test)');
    } catch (e) {
        console.error(e);
    }

}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
