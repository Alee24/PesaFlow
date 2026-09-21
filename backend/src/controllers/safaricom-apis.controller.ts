import { Request, Response } from 'express';
import {
    getSafaricomApisOverview,
    executeAccountBalanceQuery,
    executeTransactionStatusQuery,
    executeTransactionReversal,
    executeC2bUrlRegistration,
    executeC2bSimulation,
    executeB2BPayment,
    executeBusinessToPochi,
    executeRatibaStandingOrder,
    executePullTransactionsQuery,
    executeMobileValidation
} from '../services/safaricom-apis.service';

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
        merchantId?: string;
    };
}

const formatDarajaError = (error: any, fallback: string): { message: string; raw: any } => {
    const raw = error.response?.data || error.message;
    const detailed = error.response?.data?.errorMessage || error.response?.data?.error || error.message || fallback;
    let message = detailed;
    if (typeof detailed === 'string' && (detailed.toLowerCase().includes('invalid access token') || detailed.toLowerCase().includes('unauthorized'))) {
        message = 'Safaricom Daraja rejected the access token. Please verify that your Consumer Key and Consumer Secret in M-Pesa Settings match the active Daraja application and are approved for the selected environment (Production vs Sandbox) in your Safaricom Developer Portal.';
    }
    return { message, raw };
};

export const getApisOverview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.merchantId || req.user.userId;
        const data = await getSafaricomApisOverview(userId);
        res.json(data);
    } catch (error: any) {
        console.error('getApisOverview Error:', error);
        res.status(500).json({ error: error.message || 'Failed to retrieve Safaricom APIs overview' });
    }
};

export const queryAccountBalance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.merchantId || req.user.userId;
        const { remarks, identifierType } = req.body;
        const result = await executeAccountBalanceQuery(userId, remarks, identifierType);
        res.json(result);
    } catch (error: any) {
        console.error('queryAccountBalance Error:', error);
        const err = formatDarajaError(error, 'Failed to query account balance on Safaricom');
        res.status(500).json({ error: err.message, darajaResponse: err.raw });
    }
};

export const queryTransactionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.merchantId || req.user.userId;
        const { transactionId, remarks } = req.body;
        if (!transactionId) {
            res.status(400).json({ error: 'M-Pesa Transaction ID (e.g. SAB1234567) is required' });
            return;
        }
        const result = await executeTransactionStatusQuery(userId, transactionId, remarks);
        res.json(result);
    } catch (error: any) {
        console.error('queryTransactionStatus Error:', error);
        const err = formatDarajaError(error, 'Failed to query transaction status on Daraja');
        res.status(500).json({ error: err.message, darajaResponse: err.raw });
    }
};

export const requestReversal = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.merchantId || req.user.userId;
        const { transactionId, amount, remarks } = req.body;
        if (!transactionId || !amount) {
            res.status(400).json({ error: 'Transaction ID and Amount are required for reversal' });
            return;
        }
        const result = await executeTransactionReversal(userId, {
            transactionId,
            amount: Number(amount),
            remarks
        });
        res.json(result);
    } catch (error: any) {
        console.error('requestReversal Error:', error);
        const err = formatDarajaError(error, 'Failed to initiate transaction reversal');
        res.status(500).json({ error: err.message, darajaResponse: err.raw });
    }
};

export const registerC2bUrls = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.merchantId || req.user.userId;
        const { confirmationUrl, validationUrl, responseType } = req.body;
        const result = await executeC2bUrlRegistration(userId, {
            confirmationUrl,
            validationUrl,
            responseType
        });
        res.json(result);
    } catch (error: any) {
        console.error('registerC2bUrls Error:', error);
        const err = formatDarajaError(error, 'Failed to register C2B URLs with Safaricom');
        res.status(500).json({ error: err.message, darajaResponse: err.raw });
    }
};

export const simulateC2bPayment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.merchantId || req.user.userId;
        const { amount, phoneNumber, billRefNumber, commandId } = req.body;
        if (!amount || !phoneNumber) {
            res.status(400).json({ error: 'Amount and Phone Number are required' });
            return;
        }
        const result = await executeC2bSimulation(userId, {
            amount: Number(amount),
            phoneNumber,
            billRefNumber,
            commandId
        });
        res.json(result);
    } catch (error: any) {
        console.error('simulateC2bPayment Error:', error);
        const err = formatDarajaError(error, 'Failed to simulate C2B payment');
        res.status(500).json({ error: err.message, darajaResponse: err.raw });
    }
};

export const initiateB2B = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.merchantId || req.user.userId;
        const { amount, partyB, accountReference, remarks, commandId, receiverType } = req.body;
        if (!amount || !partyB || !accountReference) {
            res.status(400).json({ error: 'Amount, Destination (Party B), and Account Reference are required' });
            return;
        }
        const result = await executeB2BPayment(userId, {
            amount: Number(amount),
            partyB: String(partyB),
            accountReference,
            remarks,
            commandId,
            receiverType
        });
        res.json(result);
    } catch (error: any) {
        console.error('initiateB2B Error:', error);
        const err = formatDarajaError(error, 'Failed to process B2B transfer');
        res.status(500).json({ error: err.message, darajaResponse: err.raw });
    }
};

export const initiateBusinessToPochi = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.merchantId || req.user.userId;
        const { amount, phoneNumber, remarks } = req.body;
        if (!amount || !phoneNumber) {
            res.status(400).json({ error: 'Amount and Phone Number are required' });
            return;
        }
        const result = await executeBusinessToPochi(userId, {
            amount: Number(amount),
            phoneNumber,
            remarks
        });
        res.json(result);
    } catch (error: any) {
        console.error('initiateBusinessToPochi Error:', error);
        const err = formatDarajaError(error, 'Failed to send to Pochi la Biashara');
        res.status(500).json({ error: err.message, darajaResponse: err.raw });
    }
};

export const createRatibaOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.merchantId || req.user.userId;
        const { standingOrderName, amount, phoneNumber, frequency, startDate, endDate, accountRef, desc } = req.body;
        if (!standingOrderName || !amount || !phoneNumber || !startDate || !endDate) {
            res.status(400).json({ error: 'Name, Amount, Phone Number, Start Date, and End Date are required' });
            return;
        }
        const result = await executeRatibaStandingOrder(userId, {
            standingOrderName,
            amount: Number(amount),
            phoneNumber,
            frequency,
            startDate,
            endDate,
            accountRef: accountRef || standingOrderName,
            desc
        });
        res.json(result);
    } catch (error: any) {
        console.error('createRatibaOrder Error:', error);
        const err = formatDarajaError(error, 'Failed to create M-Pesa Ratiba standing order');
        res.status(500).json({ error: err.message, darajaResponse: err.raw });
    }
};

export const pullTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.merchantId || req.user.userId;
        const { startDate, endDate, offset } = req.body;
        if (!startDate || !endDate) {
            res.status(400).json({ error: 'Start Date and End Date are required' });
            return;
        }
        const result = await executePullTransactionsQuery(userId, {
            startDate,
            endDate,
            offset
        });
        res.json(result);
    } catch (error: any) {
        console.error('pullTransactions Error:', error);
        const err = formatDarajaError(error, 'Failed to pull transactions from Safaricom');
        res.status(500).json({ error: err.message, darajaResponse: err.raw });
    }
};

export const validateMobile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.merchantId || req.user.userId;
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            res.status(400).json({ error: 'Phone Number is required' });
            return;
        }
        const result = await executeMobileValidation(userId, phoneNumber);
        res.json(result);
    } catch (error: any) {
        console.error('validateMobile Error:', error);
        const err = formatDarajaError(error, 'Failed to validate mobile number');
        res.status(500).json({ error: err.message, darajaResponse: err.raw });
    }
};
