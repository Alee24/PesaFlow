
import { Router } from 'express';
import { createCashSale, getRecentSales, getSaleById, getSalesStats, getStaffPerformance } from '../controllers/sales.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/cash', createCashSale);
router.get('/recent', getRecentSales);
router.get('/stats', getSalesStats);
router.get('/staff-performance', getStaffPerformance);
router.get('/:id', getSaleById);

export default router;
