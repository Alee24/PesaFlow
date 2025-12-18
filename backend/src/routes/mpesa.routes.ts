
import { Router } from 'express';
import { stkPush, mpesaCallback, testConnection } from '../controllers/mpesa.controller';
import { authenticateToken, requireActive } from '../middlewares/auth.middleware';

const router = Router();

router.post('/stk-push', authenticateToken, requireActive, stkPush);
router.post('/test', authenticateToken, requireActive, testConnection);
router.post('/callback', mpesaCallback); // Public endpoint for Safaricom

export default router;
