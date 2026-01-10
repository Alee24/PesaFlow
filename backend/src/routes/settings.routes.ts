import { Router } from 'express';
import { getSettings, updateSettings, getPublicSettings } from '../controllers/settings.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Public endpoint for getting service charge info
router.get('/public', getPublicSettings);

// Admin-only endpoints
router.get('/', authenticateToken, requireAdmin, getSettings);
router.put('/', authenticateToken, requireAdmin, updateSettings);

export default router;
