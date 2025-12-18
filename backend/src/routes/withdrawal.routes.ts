
import { Router } from 'express';
import { getWithdrawals, requestWithdrawal, getAllWithdrawals, approveWithdrawal, rejectWithdrawal } from '../controllers/withdrawal.controller';
import { authenticateToken, requireAdmin, requireActive } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.get('/', getWithdrawals);
router.post('/', requireActive, requestWithdrawal);

// Admin routes
router.get('/all', requireAdmin, getAllWithdrawals);
router.post('/:id/approve', requireAdmin, approveWithdrawal);
router.post('/:id/reject', requireAdmin, rejectWithdrawal);

export default router;
