"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profile_controller_1 = require("../controllers/profile.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
router.get('/', profile_controller_1.getProfile);
router.put('/', upload_middleware_1.upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }]), profile_controller_1.updateProfile);
router.post('/test-smtp', profile_controller_1.testSmtpConnection);
router.post('/test-sms', profile_controller_1.testSMSConnection);
exports.default = router;
//# sourceMappingURL=profile.routes.js.map