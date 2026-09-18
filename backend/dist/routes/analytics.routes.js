"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("../controllers/analytics.controller");
const merchant_analytics_controller_1 = require("../controllers/merchant-analytics.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post('/track', analytics_controller_1.trackVisit);
router.get('/visitors', auth_middleware_1.authenticateToken, analytics_controller_1.getSiteVisitors);
router.get('/sales-overview', auth_middleware_1.authenticateToken, merchant_analytics_controller_1.getSalesOverview);
router.get('/product-performance', auth_middleware_1.authenticateToken, merchant_analytics_controller_1.getProductPerformance);
router.get('/customer-insights', auth_middleware_1.authenticateToken, merchant_analytics_controller_1.getCustomerInsights);
router.get('/financial-metrics', auth_middleware_1.authenticateToken, merchant_analytics_controller_1.getFinancialMetrics);
router.get('/inventory-status', auth_middleware_1.authenticateToken, merchant_analytics_controller_1.getInventoryStatus);
router.get('/team-performance', auth_middleware_1.authenticateToken, merchant_analytics_controller_1.getTeamPerformance);
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map