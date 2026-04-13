"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const subscription_middleware_1 = require("../middlewares/subscription.middleware");
const crm_controller_1 = require("../controllers/crm.controller");
const crm_pro_controller_1 = require("../controllers/crm-pro.controller");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'public/uploads/documents';
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'doc-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 25 * 1024 * 1024
    }
});
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
router.get('/customers', (0, subscription_middleware_1.requireFeature)('CRM'), crm_controller_1.getCustomers);
router.post('/customers', (0, subscription_middleware_1.requireFeature)('CRM'), crm_controller_1.createCustomer);
router.get('/customers/stats', (0, subscription_middleware_1.requireFeature)('CRM'), crm_controller_1.getCustomerStats);
router.get('/customers/:id', (0, subscription_middleware_1.requireFeature)('CRM'), crm_controller_1.getCustomer);
router.put('/customers/:id', (0, subscription_middleware_1.requireFeature)('CRM'), crm_controller_1.updateCustomer);
router.delete('/customers/:id', (0, subscription_middleware_1.requireFeature)('CRM'), crm_controller_1.deleteCustomer);
router.post('/customers/:id/notes', (0, subscription_middleware_1.requireFeature)('CRM'), crm_controller_1.addNote);
router.post('/customers/:id/interactions', (0, subscription_middleware_1.requireFeature)('CRM'), crm_controller_1.addInteraction);
router.post('/customers/:id/documents', (0, subscription_middleware_1.requireFeature)('CRM'), upload.single('file'), crm_controller_1.uploadDocument);
router.delete('/customers/:id/documents/:documentId', (0, subscription_middleware_1.requireFeature)('CRM'), crm_controller_1.deleteDocument);
router.post('/segments', (0, subscription_middleware_1.requireFeature)('ADVANCED_CRM'), crm_pro_controller_1.createSegment);
router.get('/segments', (0, subscription_middleware_1.requireFeature)('ADVANCED_CRM'), crm_pro_controller_1.getSegments);
router.get('/segments/:id/customers', (0, subscription_middleware_1.requireFeature)('ADVANCED_CRM'), crm_pro_controller_1.getSegmentCustomers);
router.post('/campaigns', (0, subscription_middleware_1.requireFeature)('ADVANCED_CRM'), crm_pro_controller_1.createCampaign);
router.get('/campaigns', (0, subscription_middleware_1.requireFeature)('ADVANCED_CRM'), crm_pro_controller_1.getCampaigns);
router.post('/campaigns/:id/send', (0, subscription_middleware_1.requireFeature)('ADVANCED_CRM'), crm_pro_controller_1.sendCampaign);
router.get('/campaigns/:id/analytics', (0, subscription_middleware_1.requireFeature)('ADVANCED_CRM'), crm_pro_controller_1.getCampaignAnalytics);
exports.default = router;
//# sourceMappingURL=crm.routes.js.map
