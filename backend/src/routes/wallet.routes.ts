import { Router } from 'express';
import { getWalletStats } from '../controllers/wallet.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/stats', authenticateToken, getWalletStats);

export default router;
