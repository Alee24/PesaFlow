import { Router } from 'express';
import {
    activateLicense,
    getLicenseStatus,
    generateServerFingerprint
} from '../middlewares/license.middleware';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Get license status (admin only)
router.get('/status', authenticateToken, requireAdmin, getLicenseStatus);

// Activate a new license (admin only)
router.post('/activate', authenticateToken, requireAdmin, activateLicense);

// Get server fingerprint for license generation (admin only)
router.get('/fingerprint', authenticateToken, requireAdmin, (req, res) => {
    const fingerprint = generateServerFingerprint();
    res.json({
        fingerprint,
        domain: process.env.DOMAIN || 'localhost',
        hostname: require('os').hostname()
    });
});

export default router;
