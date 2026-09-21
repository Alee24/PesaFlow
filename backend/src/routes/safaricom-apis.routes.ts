import { Router } from 'express';
import {
    getApisOverview,
    queryAccountBalance,
    queryTransactionStatus,
    requestReversal,
    registerC2bUrls,
    simulateC2bPayment,
    initiateB2B,
    initiateBusinessToPochi,
    createRatibaOrder,
    pullTransactions,
    validateMobile,
    getLatestAccountBalance,
    getBalanceResult
} from '../controllers/safaricom-apis.controller';
import { authenticateToken, requireActive } from '../middlewares/auth.middleware';

const router = Router();

// Overview and diagnostics
router.get('/overview', authenticateToken, requireActive, getApisOverview);

// Account Balance & Querying
router.get('/balance-latest', authenticateToken, requireActive, getLatestAccountBalance);
router.get('/balance-result/:conversationId', authenticateToken, requireActive, getBalanceResult);
router.post('/account-balance', authenticateToken, requireActive, queryAccountBalance);
router.post('/transaction-status', authenticateToken, requireActive, queryTransactionStatus);

// Reversal
router.post('/reversal', authenticateToken, requireActive, requestReversal);

// C2B v2 URLs & Simulator
router.post('/c2b/register', authenticateToken, requireActive, registerC2bUrls);
router.post('/c2b/simulate', authenticateToken, requireActive, simulateC2bPayment);

// B2B & Pochi Disbursements
router.post('/b2b', authenticateToken, requireActive, initiateB2B);
router.post('/business-to-pochi', authenticateToken, requireActive, initiateBusinessToPochi);

// Standing Orders (M-Pesa Ratiba)
router.post('/ratiba', authenticateToken, requireActive, createRatibaOrder);

// Pull Transactions & Reconciliation
router.post('/pull-transactions', authenticateToken, requireActive, pullTransactions);

// Mobile & KYC Validator
router.post('/validate-mobile', authenticateToken, requireActive, validateMobile);

export default router;
