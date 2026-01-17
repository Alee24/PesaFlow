import { Router } from 'express';
import { getKRAVATReport } from '../controllers/kra-report.controller';
import { validatePin, getKRASettings, updateKRASettings } from '../controllers/kra-integration.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

// Reports
router.get('/vat-report', getKRAVATReport);

// Verification (Open to all authenticated users for onboarding)
router.post('/verify-pin', validatePin);

// Admin Settings
router.get('/settings', requireAdmin, getKRASettings);
router.put('/settings', requireAdmin, updateKRASettings);

export default router;
