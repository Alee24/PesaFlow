import { Router } from 'express';
import {
    activateLicense,
    getLicenseStatus,
    generateServerFingerprint
} from '../middlewares/license.middleware';
import {
    submitLicenseRequest,
    getAllLicenseRequests,
    approveLicenseRequest,
    rejectLicenseRequest,
    deleteLicenseRequest
} from '../controllers/license-request.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Public route - submit license request (no auth required)
router.post('/request', submitLicenseRequest);

// Admin routes - require authentication
router.get('/status', authenticateToken, requireAdmin, getLicenseStatus);
router.post('/activate', authenticateToken, requireAdmin, activateLicense);
router.get('/fingerprint', authenticateToken, requireAdmin, (req, res) => {
    const fingerprint = generateServerFingerprint();
    res.json({
        fingerprint,
        domain: process.env.DOMAIN || 'localhost',
        hostname: require('os').hostname()
    });
});

// License request management (admin only)
router.get('/requests', authenticateToken, requireAdmin, getAllLicenseRequests);
router.post('/requests/:requestId/approve', authenticateToken, requireAdmin, approveLicenseRequest);
router.post('/requests/:requestId/reject', authenticateToken, requireAdmin, rejectLicenseRequest);
router.delete('/requests/:requestId', authenticateToken, requireAdmin, deleteLicenseRequest);

export default router;
