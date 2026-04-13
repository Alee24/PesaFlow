
import { Router } from 'express';
import { getSubscription, initiateSubscription } from '../controllers/subscription.controller';
import {
    upgradeSubscription,
    getSubscriptionStatus,
    initiateSubscriptionPayment,
    validateLicenseKey
} from '../controllers/subscription-payment.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateToken, getSubscription);
router.post('/', authenticateToken, initiateSubscription);

// New subscription payment endpoints
router.get('/status', authenticateToken, getSubscriptionStatus);
router.post('/upgrade', authenticateToken, upgradeSubscription);
router.post('/payment/initiate', authenticateToken, initiateSubscriptionPayment);
router.post('/license/validate', validateLicenseKey); // Public endpoint for enterprise validation

export default router;
