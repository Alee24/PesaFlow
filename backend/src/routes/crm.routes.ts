import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireFeature } from '../middlewares/subscription.middleware';
import {
    getCustomers,
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerStats,
    addNote,
    addInteraction,
    uploadDocument,
    deleteDocument
} from '../controllers/crm.controller';
import {
    createSegment,
    getSegments,
    getSegmentCustomers,
    createCampaign,
    getCampaigns,
    sendCampaign,
    getCampaignAnalytics
} from '../controllers/crm-pro.controller';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'public/uploads/documents';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 25 * 1024 * 1024 // 25MB limit
    }
});

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Customer Management (BASIC+)
router.get('/customers', requireFeature('CRM'), getCustomers);
router.post('/customers', requireFeature('CRM'), createCustomer);
router.get('/customers/stats', requireFeature('CRM'), getCustomerStats);
router.get('/customers/:id', requireFeature('CRM'), getCustomer);
router.put('/customers/:id', requireFeature('CRM'), updateCustomer);
router.delete('/customers/:id', requireFeature('CRM'), deleteCustomer);

// Notes and Interactions (BASIC+)
router.post('/customers/:id/notes', requireFeature('CRM'), addNote);
router.post('/customers/:id/interactions', requireFeature('CRM'), addInteraction);

// Customer Documents (BASIC+)
router.post('/customers/:id/documents', requireFeature('CRM'), upload.single('file'), uploadDocument);
router.delete('/customers/:id/documents/:documentId', requireFeature('CRM'), deleteDocument);

// Customer Segmentation (PRO only)
router.post('/segments', requireFeature('ADVANCED_CRM'), createSegment);
router.get('/segments', requireFeature('ADVANCED_CRM'), getSegments);
router.get('/segments/:id/customers', requireFeature('ADVANCED_CRM'), getSegmentCustomers);

// Email Campaigns (PRO only)
router.post('/campaigns', requireFeature('ADVANCED_CRM'), createCampaign);
router.get('/campaigns', requireFeature('ADVANCED_CRM'), getCampaigns);
router.post('/campaigns/:id/send', requireFeature('ADVANCED_CRM'), sendCampaign);
router.get('/campaigns/:id/analytics', requireFeature('ADVANCED_CRM'), getCampaignAnalytics);

export default router;
