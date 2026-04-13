"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const withdrawal_controller_1 = require("../controllers/withdrawal.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const subscription_middleware_1 = require("../middlewares/subscription.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
router.get('/', withdrawal_controller_1.getWithdrawals);
router.post('/', (0, subscription_middleware_1.requireFeature)('withdrawals'), auth_middleware_1.requireActive, withdrawal_controller_1.requestWithdrawal);
router.get('/all', auth_middleware_1.requireAdmin, withdrawal_controller_1.getAllWithdrawals);
router.post('/:id/approve', auth_middleware_1.requireAdmin, withdrawal_controller_1.approveWithdrawal);
router.post('/:id/reject', auth_middleware_1.requireAdmin, withdrawal_controller_1.rejectWithdrawal);
exports.default = router;
//# sourceMappingURL=withdrawal.routes.js.map
