"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const kra_report_controller_1 = require("../controllers/kra-report.controller");
const kra_integration_controller_1 = require("../controllers/kra-integration.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
router.get('/vat-report', kra_report_controller_1.getKRAVATReport);
router.post('/verify-pin', kra_integration_controller_1.validatePin);
router.get('/settings', auth_middleware_1.requireAdmin, kra_integration_controller_1.getKRASettings);
router.put('/settings', auth_middleware_1.requireAdmin, kra_integration_controller_1.updateKRASettings);
exports.default = router;
//# sourceMappingURL=kra.routes.js.map