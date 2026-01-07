import { Router } from 'express';
import {
    getSalesOverview,
    getProductPerformance,
    getCustomerInsights,
    getFinancialMetrics,
    getInventoryStatus,
    getTeamPerformance
} from '../controllers/analytics.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireFeature } from '../middlewares/subscription.middleware';

const router = Router();

// All analytics routes require authentication and PRO plan
router.use(authenticateToken);
router.use(requireFeature('analytics'));

router.get('/sales-overview', getSalesOverview);
router.get('/product-performance', getProductPerformance);
router.get('/customer-insights', getCustomerInsights);
router.get('/financial-metrics', getFinancialMetrics);
router.get('/inventory-status', getInventoryStatus);
router.get('/team-performance', getTeamPerformance);

export default router;
