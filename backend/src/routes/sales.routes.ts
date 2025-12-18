
import { Router } from 'express';
import { createCashSale, getRecentSales } from '../controllers/sales.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/cash', createCashSale);
router.get('/recent', getRecentSales);

export default router;
