"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const safaricom_apis_controller_1 = require("../controllers/safaricom-apis.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/overview', auth_middleware_1.authenticateToken, auth_middleware_1.requireActive, safaricom_apis_controller_1.getApisOverview);
router.post('/account-balance', auth_middleware_1.authenticateToken, auth_middleware_1.requireActive, safaricom_apis_controller_1.queryAccountBalance);
router.post('/transaction-status', auth_middleware_1.authenticateToken, auth_middleware_1.requireActive, safaricom_apis_controller_1.queryTransactionStatus);
router.post('/reversal', auth_middleware_1.authenticateToken, auth_middleware_1.requireActive, safaricom_apis_controller_1.requestReversal);
router.post('/c2b/register', auth_middleware_1.authenticateToken, auth_middleware_1.requireActive, safaricom_apis_controller_1.registerC2bUrls);
router.post('/c2b/simulate', auth_middleware_1.authenticateToken, auth_middleware_1.requireActive, safaricom_apis_controller_1.simulateC2bPayment);
router.post('/b2b', auth_middleware_1.authenticateToken, auth_middleware_1.requireActive, safaricom_apis_controller_1.initiateB2B);
router.post('/business-to-pochi', auth_middleware_1.authenticateToken, auth_middleware_1.requireActive, safaricom_apis_controller_1.initiateBusinessToPochi);
router.post('/ratiba', auth_middleware_1.authenticateToken, auth_middleware_1.requireActive, safaricom_apis_controller_1.createRatibaOrder);
router.post('/pull-transactions', auth_middleware_1.authenticateToken, auth_middleware_1.requireActive, safaricom_apis_controller_1.pullTransactions);
router.post('/validate-mobile', auth_middleware_1.authenticateToken, auth_middleware_1.requireActive, safaricom_apis_controller_1.validateMobile);
exports.default = router;
//# sourceMappingURL=safaricom-apis.routes.js.map