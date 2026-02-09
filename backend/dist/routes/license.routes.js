"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const license_middleware_1 = require("../middlewares/license.middleware");
const license_request_controller_1 = require("../controllers/license-request.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post('/request', license_request_controller_1.submitLicenseRequest);
router.get('/status', license_middleware_1.getLicenseStatus);
router.get('/fingerprint', (req, res) => {
    const fingerprint = (0, license_middleware_1.generateServerFingerprint)();
    res.json({
        fingerprint,
        domain: process.env.DOMAIN || 'localhost',
        hostname: require('os').hostname()
    });
});
router.post('/activate', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, license_middleware_1.activateLicense);
router.get('/requests', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, license_request_controller_1.getAllLicenseRequests);
router.post('/requests/:requestId/approve', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, license_request_controller_1.approveLicenseRequest);
router.post('/requests/:requestId/reject', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, license_request_controller_1.rejectLicenseRequest);
router.delete('/requests/:requestId', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, license_request_controller_1.deleteLicenseRequest);
exports.default = router;
//# sourceMappingURL=license.routes.js.map