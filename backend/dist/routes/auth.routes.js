"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
router.post('/register', auth_controller_1.register);
router.get('/verify-email', auth_controller_1.verifyEmail);
router.post('/complete-profile', auth_middleware_1.authenticateToken, upload_middleware_1.upload.fields([
    { name: 'idFront', maxCount: 1 },
    { name: 'idBack', maxCount: 1 },
    { name: 'businessPermit', maxCount: 1 },
    { name: 'registrationCert', maxCount: 1 },
    { name: 'kraCert', maxCount: 1 }
]), auth_controller_1.completeProfile);
router.post('/login', auth_controller_1.login);
router.get('/me', auth_middleware_1.authenticateToken, auth_controller_1.getCurrentUser);
router.get('/current-user', auth_middleware_1.authenticateToken, auth_controller_1.getCurrentUser);
router.put('/me', auth_middleware_1.authenticateToken, auth_controller_1.updateUser);
router.post('/resend-verification', auth_middleware_1.authenticateToken, auth_controller_1.resendVerification);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map