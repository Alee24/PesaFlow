
import { Router } from 'express';
import { stkPush, mpesaCallback, testConnection, initiateInvoicePayment, resetMpesaConfig } from '../controllers/mpesa.controller';
import { authenticateToken, requireActive } from '../middlewares/auth.middleware';

const router = Router();

router.post('/stk-push', authenticateToken, requireActive, stkPush);
router.post('/stkpush/invoice', authenticateToken, requireActive, initiateInvoicePayment);
router.post('/test', authenticateToken, requireActive, testConnection);
router.post('/reset-config', authenticateToken, requireActive, resetMpesaConfig); // New Endpoint
router.post('/callback', mpesaCallback); // Public endpoint for Safaricom

export default router;
