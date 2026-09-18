import { Router } from 'express';
import { trackVisit, getSiteVisitors } from '../controllers/analytics.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Public endpoint for tracking
router.post('/track', trackVisit);

// Protected endpoint for admin
router.get('/visitors', authenticateToken, getSiteVisitors);

export default router;
