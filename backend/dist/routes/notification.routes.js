"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("../controllers/notification.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
router.get('/', notification_controller_1.getNotifications);
router.post('/read', notification_controller_1.markRead);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map