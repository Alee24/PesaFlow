"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mpesa_controller_1 = require("../controllers/mpesa.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post('/stk-push', auth_middleware_1.authenticateToken, auth_middleware_1.requireActive, mpesa_controller_1.stkPush);
router.post('/stkpush/invoice', auth_middleware_1.authenticateToken, auth_middleware_1.requireActive, mpesa_controller_1.initiateInvoicePayment);
router.post('/test', auth_middleware_1.authenticateToken, auth_middleware_1.requireActive, mpesa_controller_1.testConnection);
router.post('/reset-config', auth_middleware_1.authenticateToken, auth_middleware_1.requireActive, mpesa_controller_1.resetMpesaConfig);
router.post('/callback', mpesa_controller_1.mpesaCallback);
exports.default = router;
//# sourceMappingURL=mpesa.routes.js.map
