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
    addInteraction
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
