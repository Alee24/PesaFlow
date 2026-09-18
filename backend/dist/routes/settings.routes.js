"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = require("../controllers/settings.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/public', settings_controller_1.getPublicSettings);
router.get('/', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, settings_controller_1.getSettings);
router.put('/', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, settings_controller_1.updateSettings);
router.post('/test-email', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, settings_controller_1.sendTestEmail);
router.post('/test-sms', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, settings_controller_1.sendTestSMS);
exports.default = router;
//# sourceMappingURL=settings.routes.js.map