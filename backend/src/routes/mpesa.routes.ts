
import { Router } from 'express';
import { 
    stkPush, 
    mpesaCallback, 
    testConnection, 
    initiateInvoicePayment, 
    resetMpesaConfig, 
    bulkProcess, 
    manualCompleteMpesa, 
    getMpesaStatus,
    generateQrCode,
    generateProductQrCode
} from '../controllers/mpesa.controller';
import { authenticateToken, requireActive } from '../middlewares/auth.middleware';

const router = Router();

router.post('/stk-push', authenticateToken, requireActive, stkPush);
router.post('/stkpush/invoice', authenticateToken, requireActive, initiateInvoicePayment);
router.post('/manual-complete', authenticateToken, requireActive, manualCompleteMpesa);
router.get('/status/:checkoutRequestId', authenticateToken, getMpesaStatus);
router.get('/status', authenticateToken, getMpesaStatus);
router.post('/qr/generate', authenticateToken, requireActive, generateQrCode);
router.get('/qr/product/:id', authenticateToken, requireActive, generateProductQrCode);
router.post('/test', authenticateToken, requireActive, testConnection);
router.post('/reset-config', authenticateToken, requireActive, resetMpesaConfig); // New Endpoint
router.post('/bulk-process', authenticateToken, requireActive, bulkProcess); // Bulk Payment Processing
router.post('/callback', mpesaCallback); // Legacy Public endpoint for Safaricom
router.post('/callback/:merchantId', mpesaCallback); // Unique endpoint per merchant

export default router;
