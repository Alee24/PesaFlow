
import { Router } from 'express';
import { getTransactions, getTransactionById, updateTransactionStatus } from '../controllers/transaction.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.get('/', getTransactions);
router.get('/:id', getTransactionById);
router.patch('/:id/status', updateTransactionStatus);

export default router;
