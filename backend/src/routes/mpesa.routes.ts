
import { Router } from 'express';
import { stkPush, mpesaCallback, testConnection, initiateInvoicePayment, resetMpesaConfig, bulkProcess, manualCompleteMpesa } from '../controllers/mpesa.controller';
import { authenticateToken, requireActive } from '../middlewares/auth.middleware';

const router = Router();

router.post('/stk-push', authenticateToken, requireActive, stkPush);
router.post('/stkpush/invoice', authenticateToken, requireActive, initiateInvoicePayment);
router.post('/manual-complete', authenticateToken, requireActive, manualCompleteMpesa);
router.post('/test', authenticateToken, requireActive, testConnection);
router.post('/reset-config', authenticateToken, requireActive, resetMpesaConfig); // New Endpoint
router.post('/bulk-process', authenticateToken, requireActive, bulkProcess); // Bulk Payment Processing
router.post('/callback', mpesaCallback); // Public endpoint for Safaricom

export default router;
