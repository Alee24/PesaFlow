
import { Router } from 'express';
import { stkPush, mpesaCallback } from '../controllers/mpesa.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/stk-push', authenticateToken, stkPush);
router.post('/callback', mpesaCallback); // Public endpoint for Safaricom

export default router;
