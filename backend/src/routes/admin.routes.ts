import { Router } from 'express';
import { getAllUsers, createUser, updateUserStatus, verifyUser, getAdminStats, updateUser, deleteUser, resetUserPassword, manageSubscription, getSystemStatus, triggerSystemUpdate, getSystemUpdateLogs } from '../controllers/admin.controller';
import { getSystemLogs } from '../controllers/admin-logs.controller';
import { assignSubscription } from '../controllers/admin-subscription.controller';
import { getOverview, getTopMerchants, getPaymentMethods, getRevenueTrends, getTopProducts } from '../controllers/admin.analytics.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Ensure all routes are protected and require ADMIN role
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/verify', verifyUser); // New verification endpoint
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/password', resetUserPassword);
router.post('/users/:id/subscription', manageSubscription);
router.patch('/users/:userId/assign-subscription', assignSubscription); // New endpoint
router.get('/system/status', getSystemStatus);
router.get('/system/update/status', getSystemUpdateLogs);
router.post('/system/update', triggerSystemUpdate);
router.get('/system/logs', getSystemLogs);

// Analytics routes
router.get('/analytics/overview', getOverview);
router.get('/analytics/merchants', getTopMerchants);
router.get('/analytics/payment-methods', getPaymentMethods);
router.get('/analytics/trends', getRevenueTrends);
router.get('/analytics/products', getTopProducts);

export default router;
