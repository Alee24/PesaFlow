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
        const { remarks } = req.body;
        const result = await executeAccountBalanceQuery(userId, remarks);
        res.json(result);
    } catch (error: any) {
        console.error('queryAccountBalance Error:', error);
        const detailed = error.response?.data?.errorMessage || error.message;
        res.status(500).json({ error: detailed || 'Failed to query account balance on Safaricom' });
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
        const detailed = error.response?.data?.errorMessage || error.message;
        res.status(500).json({ error: detailed || 'Failed to query transaction status on Daraja' });
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
        const detailed = error.response?.data?.errorMessage || error.message;
        res.status(500).json({ error: detailed || 'Failed to initiate transaction reversal' });
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
        const detailed = error.response?.data?.errorMessage || error.message;
        res.status(500).json({ error: detailed || 'Failed to register C2B URLs with Safaricom' });
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
        const detailed = error.response?.data?.errorMessage || error.message;
        res.status(500).json({ error: detailed || 'Failed to simulate C2B payment' });
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
        const detailed = error.response?.data?.errorMessage || error.message;
        res.status(500).json({ error: detailed || 'Failed to process B2B transfer' });
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
        const detailed = error.response?.data?.errorMessage || error.message;
        res.status(500).json({ error: detailed || 'Failed to send to Pochi la Biashara' });
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
        const detailed = error.response?.data?.errorMessage || error.message;
        res.status(500).json({ error: detailed || 'Failed to create M-Pesa Ratiba standing order' });
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
        const detailed = error.response?.data?.errorMessage || error.message;
        res.status(500).json({ error: detailed || 'Failed to pull transactions from Safaricom' });
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
        res.status(500).json({ error: error.message || 'Failed to validate mobile number' });
    }
};
