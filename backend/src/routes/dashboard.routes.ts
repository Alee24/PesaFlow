
import { Router } from 'express';
import { getDashboardStats, getInvoiceStats } from '../controllers/dashboard.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.get('/stats', getDashboardStats);
router.get('/invoices-stats', getInvoiceStats);

export default router;
