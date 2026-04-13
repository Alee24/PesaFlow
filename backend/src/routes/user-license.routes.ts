import { Router } from 'express';
import {
    generateUserLicenseKeys,
    getAllUserLicenseKeys,
    activateUserLicenseKey,
    purchaseEnterprisePlan,
    deleteUserLicenseKey
} from '../controllers/user-license.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// User routes - Allow activation without auth (for initial setup)
router.post('/activate', activateUserLicenseKey);
router.post('/purchase', authenticateToken, purchaseEnterprisePlan);

// Admin routes - require admin access
router.post('/generate', authenticateToken, requireAdmin, generateUserLicenseKeys);
router.get('/keys', authenticateToken, requireAdmin, getAllUserLicenseKeys);
router.delete('/keys/:keyId', authenticateToken, requireAdmin, deleteUserLicenseKey);

export default router;
