"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subscription_controller_1 = require("../controllers/subscription.controller");
const subscription_payment_controller_1 = require("../controllers/subscription-payment.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticateToken, subscription_controller_1.getSubscription);
router.post('/', auth_middleware_1.authenticateToken, subscription_controller_1.initiateSubscription);
router.get('/status', auth_middleware_1.authenticateToken, subscription_payment_controller_1.getSubscriptionStatus);
router.post('/upgrade', auth_middleware_1.authenticateToken, subscription_payment_controller_1.upgradeSubscription);
router.post('/payment/initiate', auth_middleware_1.authenticateToken, subscription_payment_controller_1.initiateSubscriptionPayment);
router.post('/license/validate', subscription_payment_controller_1.validateLicenseKey);
exports.default = router;
//# sourceMappingURL=subscription.routes.js.map
