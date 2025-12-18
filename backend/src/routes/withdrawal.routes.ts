
import { Router } from 'express';
import { getWithdrawals, requestWithdrawal, getAllWithdrawals, approveWithdrawal, rejectWithdrawal } from '../controllers/withdrawal.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.get('/', getWithdrawals);
router.post('/', requestWithdrawal);

// Admin routes
router.get('/all', getAllWithdrawals);
router.post('/:id/approve', approveWithdrawal);
router.post('/:id/reject', rejectWithdrawal);

export default router;
