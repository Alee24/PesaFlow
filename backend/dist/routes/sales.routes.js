"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sales_controller_1 = require("../controllers/sales.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const subscription_middleware_1 = require("../middlewares/subscription.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
router.post('/cash', auth_middleware_1.requireActive, subscription_middleware_1.checkTransactionLimit, sales_controller_1.createCashSale);
router.get('/', sales_controller_1.getRecentSales);
router.get('/stats', sales_controller_1.getSalesStats);
router.get('/staff-performance', sales_controller_1.getStaffPerformance);
router.get('/:id', sales_controller_1.getSaleById);
exports.default = router;
//# sourceMappingURL=sales.routes.js.map
