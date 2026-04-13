"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const system_health_controller_1 = require("../controllers/system-health.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/health', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, system_health_controller_1.getSystemHealth);
router.post('/test-mpesa', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, system_health_controller_1.testMpesaSTK);
router.post('/test-email', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, system_health_controller_1.testEmailSending);
router.post('/fix-invoice-stats', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, system_health_controller_1.fixInvoiceStats);
exports.default = router;
//# sourceMappingURL=system-health.routes.js.map
