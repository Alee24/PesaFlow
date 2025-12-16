
import { Router } from 'express';
import { getWithdrawals, requestWithdrawal } from '../controllers/withdrawal.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.get('/', getWithdrawals);
router.post('/', requestWithdrawal);

export default router;
