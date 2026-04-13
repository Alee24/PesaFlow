
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Integration for Equity (Jenga API), KCB (Buni), and Co-op Bank
export class BankService {
    public static async getKCBToken(creds: any) {
        try {
            const url = creds.env === 'production'
                ? 'https://api.buni.kcbgroup.com/token'
                : 'https://uat.buni.kcbgroup.com/token';

            const auth = Buffer.from(`${creds.consumerKey}:${creds.consumerSecret}`).toString('base64');

            const response = await axios.post(url, 'grant_type=client_credentials', {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            return response.data.access_token;
        } catch (error: any) {
            console.error('[KCB] Auth Error:', error.response?.data || error.message);
            throw new Error('KCB Authentication Failed');
        }
    }

    public static async getJengaToken(creds: any) {
        try {
            const url = creds.env === 'production' 
                ? 'https://api.jengaapi.io/authentication/v1/login' 
                : 'https://sandbox.jengaapi.io/authentication/v1/login';
            
            const response = await axios.post(url, {
                merchantId: creds.merchantId,
                apiKey: creds.apiKey
            }, {
                headers: { 'Content-Type': 'application/json' }
            });
            return response.data.accessToken;
        } catch (error: any) {
            console.error('[JENGA] Auth Error:', error.response?.data || error.message);
            throw new Error('Jenga Authentication Failed');
        }
    }

    static async initiateBankTransfer(userId: string, data: any, provider: 'JENGA' | 'KCB' = 'JENGA') {
        if (provider === 'KCB') return this.initiateKCBTransfer(userId, data);
        
        const profile = await prisma.businessProfile.findUnique({ where: { userId } });
        // @ts-ignore
        if (!profile || !profile.jengaApiKey) {
            throw new Error('Bank integration (Jenga) not configured for this user');
        }

        const token = await this.getJengaToken({
            // @ts-ignore
            merchantId: profile.jengaMerchantId,
            // @ts-ignore
            apiKey: profile.jengaApiKey,
            // @ts-ignore
            env: profile.jengaEnv
        });

        const url = profile.jengaEnv === 'production'
            ? 'https://api.jengaapi.io/transaction/v1/remittance/send-to-bank'
            : 'https://sandbox.jengaapi.io/transaction/v1/remittance/send-to-bank';

        const requestBody = {
            source: {
                countryCode: "KE",
                name: profile.companyName,
                accountNumber: profile.bankDetails || "0000000000" // Merchant's own account
            },
            destination: {
                type: "bank",
                countryCode: "KE",
                name: data.accountName,
                bankCode: data.bankCode,
                accountNumber: data.accountNumber
            },
            transfer: {
                type: "PesaLink", // Default to PesaLink for real-time interbank
                amount: data.amount,
                currency: "KES",
                reference: data.reference,
                date: new Date().toISOString().split('T')[0],
                description: data.description || "Bank Disbursement"
            }
        };

        // Create transaction record
        const wallet = await prisma.wallet.findFirst({ where: { userId } });
        if (!wallet) throw new Error("Wallet not found");

        const transaction = await prisma.transaction.create({
            data: {
                type: 'WITHDRAWAL',
                amount: data.amount,
                // @ts-ignore
                channel: 'BANK',
                // @ts-ignore
                bankName: data.bankCode,
                reference: data.reference,
                initiatorUserId: userId,
                recipientWalletId: wallet.id,
                status: 'PENDING',
                metadata: JSON.stringify({ ...data, provider: 'JENGA' })
            }
        });

        try {
            const response = await axios.post(url, requestBody, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    // Jenga often requires a signature (RSA) in production, adding placeholder for now
                    'Signature': 'SIGNATURE_HERE' 
                }
            });

            await prisma.transaction.update({
                where: { id: transaction.id },
                data: { 
                    merchantRequestId: response.data.transactionReference,
                    metadata: JSON.stringify({ ...data, provider: 'JENGA', response: response.data })
                }
            });

            return response.data;
        } catch (error: any) {
            console.error('[BANK TRANSFER] Error:', error.response?.data || error.message);
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: { status: 'FAILED', metadata: JSON.stringify({ error: error.response?.data || error.message }) }
            });
            throw new Error(error.response?.data?.message || 'Bank Transfer Failed');
        }
    }

    static async initiateKCBTransfer(userId: string, data: any) {
        const profile = await prisma.businessProfile.findUnique({ where: { userId } });
        // @ts-ignore
        if (!profile || !profile.kcbConsumerKey) {
            throw new Error('KCB integration not configured for this user');
        }

        const token = await this.getKCBToken({
            // @ts-ignore
            consumerKey: profile.kcbConsumerKey,
            // @ts-ignore
            consumerSecret: profile.kcbConsumerSecret,
            // @ts-ignore
            env: profile.kcbEnv
        });

        const url = profile.kcbEnv === 'production'
            ? 'https://api.buni.kcbgroup.com/fundstransfer/v1/transfer'
            : 'https://uat.buni.kcbgroup.com/fundstransfer/v1/transfer';

        // Custom KCB Structure (Example mapping for FundsTransferAPIService)
        const requestBody = {
            header: {
                messageRef: data.reference,
                channelRef: "Mpesa Connect",
                timestamp: new Date().toISOString()
            },
            payload: {
                sourceAccount: profile.bankDetails || "0123456789", // Merchant's KCB or settlement account
                destinationAccount: data.accountNumber,
                amount: data.amount,
                currency: "KES",
                bankCode: data.bankCode,
                remarks: data.description || "Mpesa Connect Disbursement"
            }
        };

        const wallet = await prisma.wallet.findFirst({ where: { userId } });
        if (!wallet) throw new Error("Wallet not found");

        const transaction = await prisma.transaction.create({
            data: {
                type: 'WITHDRAWAL',
                amount: data.amount,
                // @ts-ignore
                channel: 'BANK',
                // @ts-ignore
                bankName: data.bankCode,
                reference: data.reference,
                initiatorUserId: userId,
                recipientWalletId: wallet.id,
                status: 'PENDING',
                metadata: JSON.stringify({ ...data, provider: 'KCB' })
            }
        });

        try {
            const response = await axios.post(url, requestBody, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            await prisma.transaction.update({
                where: { id: transaction.id },
                data: { 
                    merchantRequestId: response.data.header?.responseRef,
                    metadata: JSON.stringify({ ...data, provider: 'KCB', response: response.data })
                }
            });

            return response.data;
        } catch (error: any) {
            console.error('[KCB TRANSFER] Error:', error.response?.data || error.message);
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: { status: 'FAILED', metadata: JSON.stringify({ error: error.response?.data || error.message }) }
            });
            throw new Error(error.response?.data?.message || 'KCB Transfer Failed');
        }
    }
}
