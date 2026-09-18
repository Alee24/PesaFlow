
import { Router } from 'express';
import { getTransactions, getTransactionById, updateTransactionStatus, sendReceiptEmail } from '../controllers/transaction.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import multer from 'multer';

const uploadMemory = multer({ storage: multer.memoryStorage() });
const router = Router();

router.use(authenticateToken);
router.get('/', getTransactions);
router.get('/:id', getTransactionById);
router.patch('/:id/status', updateTransactionStatus);
router.post('/:id/email', uploadMemory.single('file'), sendReceiptEmail);

export default router;
