
import { Router } from 'express';
import { getTransactions } from '../controllers/transaction.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.get('/', getTransactions);

export default router;
