
import { Router } from 'express';
import { getWithdrawals, requestWithdrawal, getAllWithdrawals, approveWithdrawal, rejectWithdrawal } from '../controllers/withdrawal.controller';
import { authenticateToken, requireAdmin, requireActive } from '../middlewares/auth.middleware';
import { requireFeature } from '../middlewares/subscription.middleware';

const router = Router();

router.use(authenticateToken);
router.get('/', getWithdrawals);

// Withdrawals require PRO plan
router.post('/', requireFeature('withdrawals'), requireActive, requestWithdrawal);

// Admin routes
router.get('/all', requireAdmin, getAllWithdrawals);
router.post('/:id/approve', requireAdmin, approveWithdrawal);
router.post('/:id/reject', requireAdmin, rejectWithdrawal);

export default router;
