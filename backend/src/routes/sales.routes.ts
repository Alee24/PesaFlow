
import { Router } from 'express';
import { createCashSale, getRecentSales, getSaleById, getSalesStats, getStaffPerformance, sendSaleEmail } from '../controllers/sales.controller';
import { authenticateToken, requireActive } from '../middlewares/auth.middleware';
import { checkTransactionLimit } from '../middlewares/subscription.middleware';
import multer from 'multer';

const uploadMemory = multer({ storage: multer.memoryStorage() });
const router = Router();

router.use(authenticateToken);

router.post('/cash', requireActive, checkTransactionLimit, createCashSale);
router.get('/', getRecentSales);
router.get('/stats', getSalesStats);
router.get('/staff-performance', getStaffPerformance);
router.get('/:id', getSaleById);
router.post('/:id/email', uploadMemory.single('file'), sendSaleEmail);

export default router;