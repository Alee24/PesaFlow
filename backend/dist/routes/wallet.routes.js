"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wallet_controller_1 = require("../controllers/wallet.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/stats', auth_middleware_1.authenticateToken, wallet_controller_1.getWalletStats);
router.get('/', auth_middleware_1.authenticateToken, wallet_controller_1.getWalletStats);
exports.default = router;
//# sourceMappingURL=wallet.routes.js.map