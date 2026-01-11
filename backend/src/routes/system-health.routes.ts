import { Router } from 'express';
import {
    getSystemHealth,
    testMpesaSTK,
    testEmailSending
} from '../controllers/system-health.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// All routes require admin authentication
router.get('/health', authenticateToken, requireAdmin, getSystemHealth);
router.post('/test-mpesa', authenticateToken, requireAdmin, testMpesaSTK);
router.post('/test-email', authenticateToken, requireAdmin, testEmailSending);

export default router;
