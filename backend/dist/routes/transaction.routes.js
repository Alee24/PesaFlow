"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transaction_controller_1 = require("../controllers/transaction.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
router.get('/', transaction_controller_1.getTransactions);
router.get('/:id', transaction_controller_1.getTransactionById);
router.patch('/:id/status', transaction_controller_1.updateTransactionStatus);
exports.default = router;
//# sourceMappingURL=transaction.routes.js.map