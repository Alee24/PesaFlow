import { Router } from 'express';
import { getAllUsers, createUser, updateUserStatus, verifyUser, getAdminStats, updateUser, deleteUser, resetUserPassword, manageSubscription, getSystemStatus, triggerSystemUpdate, getSystemUpdateLogs } from '../controllers/admin.controller';
import { getSystemLogs } from '../controllers/admin-logs.controller';
import { assignSubscription } from '../controllers/admin-subscription.controller';
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

export default router;
