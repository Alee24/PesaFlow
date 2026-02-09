"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoice_controller_1 = require("../controllers/invoice.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const subscription_middleware_1 = require("../middlewares/subscription.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
router.use((0, subscription_middleware_1.requireFeature)('invoices'));
router.post('/', auth_middleware_1.requireActive, invoice_controller_1.createInvoice);
router.post('/:id/email', upload_middleware_1.uploadMemory.single('file'), invoice_controller_1.sendInvoiceEmail);
router.get('/', invoice_controller_1.getInvoices);
exports.default = router;
//# sourceMappingURL=invoice.routes.js.map