"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_dashboard_controller_1 = require("../controllers/admin-dashboard.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/system-dashboard', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, admin_dashboard_controller_1.getSystemDashboard);
router.get('/merchant-performance/:merchantId', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, admin_dashboard_controller_1.getMerchantPerformance);
router.get('/service-charge-report', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, admin_dashboard_controller_1.getServiceChargeReport);
exports.default = router;
//# sourceMappingURL=admin-dashboard.routes.js.map
