"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const support_controller_1 = require("../controllers/support.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
router.post('/', support_controller_1.createTicket);
router.get('/', support_controller_1.getTickets);
router.get('/:id', support_controller_1.getTicket);
router.post('/:id/reply', support_controller_1.replyTicket);
exports.default = router;
//# sourceMappingURL=support.routes.js.map
