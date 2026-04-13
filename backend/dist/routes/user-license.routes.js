"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_license_controller_1 = require("../controllers/user-license.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post('/activate', user_license_controller_1.activateUserLicenseKey);
router.post('/purchase', auth_middleware_1.authenticateToken, user_license_controller_1.purchaseEnterprisePlan);
router.post('/generate', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, user_license_controller_1.generateUserLicenseKeys);
router.get('/keys', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, user_license_controller_1.getAllUserLicenseKeys);
router.delete('/keys/:keyId', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, user_license_controller_1.deleteUserLicenseKey);
exports.default = router;
//# sourceMappingURL=user-license.routes.js.map
