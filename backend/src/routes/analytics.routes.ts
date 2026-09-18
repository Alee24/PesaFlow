import { Router } from 'express';
import { trackVisit, getSiteVisitors } from '../controllers/analytics.controller';
import { 
    getSalesOverview, 
    getProductPerformance, 
    getCustomerInsights, 
    getFinancialMetrics, 
    getInventoryStatus, 
    getTeamPerformance 
} from '../controllers/merchant-analytics.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Public endpoint for tracking
router.post('/track', trackVisit);

// Protected endpoint for admin
router.get('/visitors', authenticateToken, getSiteVisitors);

// Merchant Analytics
router.get('/sales-overview', authenticateToken, getSalesOverview);
router.get('/product-performance', authenticateToken, getProductPerformance);
router.get('/customer-insights', authenticateToken, getCustomerInsights);
router.get('/financial-metrics', authenticateToken, getFinancialMetrics);
router.get('/inventory-status', authenticateToken, getInventoryStatus);
router.get('/team-performance', authenticateToken, getTeamPerformance);

export default router;
