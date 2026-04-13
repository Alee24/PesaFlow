
import { Request, Response } from 'express';
import { BankService } from '../services/bank.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

export const initiateBankTransfer = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { amount, bankCode, accountNumber, accountName, reference, description, provider } = req.body;

        if (!amount || !bankCode || !accountNumber || !accountName) {
            res.status(400).json({ error: 'Missing mandatory bank transfer details' });
            return;
        }

        console.log(`🚀 [BANK] Initiating transfer of ${amount} to ${bankCode} ${accountNumber} (${accountName}) via ${provider || 'JENGA'}`);
        
        const response = await BankService.initiateBankTransfer(req.user.userId, {
            amount: Number(amount),
            bankCode,
            accountNumber,
            accountName,
            reference: reference || `BANK-${Date.now()}`,
            description: description || 'Mpesa Connect Bank Disbursement'
        }, provider || 'JENGA');

        res.json({
            success: true,
            message: 'Bank transfer initiated successfully',
            data: response
        });

    } catch (error: any) {
        console.error('[BANK CONTROLLER] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

export const testBankConnection = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { provider } = req.body; // 'JENGA' or 'KCB'

        if (provider === 'JENGA') {
            // Jenga Test (Tries to get token)
            const profile = await prisma.businessProfile.findUnique({ where: { userId: req.user.userId } });
            if (!profile?.jengaApiKey) throw new Error('Jenga API Key not configured');
            
            // Jenga token fetch is usually a good connection test
            // @ts-ignore
            await BankService.getJengaToken({
                merchantId: profile.jengaMerchantId,
                apiKey: profile.jengaApiKey,
                env: profile.jengaEnv
            });
            res.json({ success: true, message: 'Jenga API Connection Successful!' });
        } else if (provider === 'KCB') {
            // KCB Test (Tries to get token)
            const profile = await prisma.businessProfile.findUnique({ where: { userId: req.user.userId } });
            if (!profile?.kcbConsumerKey) throw new Error('KCB Consumer Key not configured');

            await BankService.getKCBToken({
                consumerKey: profile.kcbConsumerKey,
                consumerSecret: profile.kcbConsumerSecret,
                env: profile.kcbEnv
            });
            res.json({ success: true, message: 'KCB Buni Connection Successful!' });
        } else {
            res.status(400).json({ error: 'Unsupported test provider' });
        }
    } catch (error: any) {
        console.error('[BANK TEST] Error:', error.message);
        res.status(400).json({ error: error.message || 'Connection failed' });
    }
};

export const getBanksList = async (req: Request, res: Response): Promise<void> => {
    // Standard Kenyan Bank Codes (Equity: 068, KCB: 001, Co-op: 011, etc.)
    const banks = [
        { code: '001', name: 'KCB Bank Kenya' },
        { code: '068', name: 'Equity Bank Kenya' },
        { code: '011', name: 'Co-operative Bank of Kenya' },
        { code: '003', name: 'Absa Bank Kenya' },
        { code: '012', name: 'National Bank of Kenya' },
        { code: '002', name: 'Standard Chartered Kenya' },
        { code: '063', name: 'Diamond Trust Bank (DTB)' },
        { code: '041', name: 'NCBA Bank Kenya' },
        { code: '070', name: 'Family Bank Kenya' },
        { code: '051', name: 'Stanbic Bank Kenya' },
        { code: '049', name: 'I&M Bank Kenya' }
    ];
    res.json(banks);
};
