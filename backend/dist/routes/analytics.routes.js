"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("../controllers/analytics.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const subscription_middleware_1 = require("../middlewares/subscription.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
router.use((0, subscription_middleware_1.requireFeature)('analytics'));
router.get('/sales-overview', analytics_controller_1.getSalesOverview);
router.get('/product-performance', analytics_controller_1.getProductPerformance);
router.get('/customer-insights', analytics_controller_1.getCustomerInsights);
router.get('/financial-metrics', analytics_controller_1.getFinancialMetrics);
router.get('/inventory-status', analytics_controller_1.getInventoryStatus);
router.get('/team-performance', analytics_controller_1.getTeamPerformance);
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map