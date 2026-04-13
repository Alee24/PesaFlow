
import { Router } from 'express';
import { createCashSale, getRecentSales, getSaleById, getSalesStats, getStaffPerformance } from '../controllers/sales.controller';
import { authenticateToken, requireActive } from '../middlewares/auth.middleware';
import { checkTransactionLimit } from '../middlewares/subscription.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/cash', requireActive, checkTransactionLimit, createCashSale);
router.get('/', getRecentSales);
router.get('/stats', getSalesStats);
router.get('/staff-performance', getStaffPerformance);
router.get('/:id', getSaleById);

export default router;
