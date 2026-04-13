import { Router } from 'express';
import {
    getSystemDashboard,
    getMerchantPerformance,
    getServiceChargeReport
} from '../controllers/admin-dashboard.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// All routes require admin authentication
router.get('/system-dashboard', authenticateToken, requireAdmin, getSystemDashboard);
router.get('/merchant-performance/:merchantId', authenticateToken, requireAdmin, getMerchantPerformance);
router.get('/service-charge-report', authenticateToken, requireAdmin, getServiceChargeReport);

export default router;
