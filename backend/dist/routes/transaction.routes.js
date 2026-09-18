"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transaction_controller_1 = require("../controllers/transaction.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const multer_1 = __importDefault(require("multer"));
const uploadMemory = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
router.get('/', transaction_controller_1.getTransactions);
router.get('/:id', transaction_controller_1.getTransactionById);
router.patch('/:id/status', transaction_controller_1.updateTransactionStatus);
router.post('/:id/email', uploadMemory.single('file'), transaction_controller_1.sendReceiptEmail);
exports.default = router;
//# sourceMappingURL=transaction.routes.js.map