import { Router } from 'express';
import { getAllUsers, createUser, updateUserStatus, getAdminStats, updateUser, deleteUser, resetUserPassword, manageSubscription, getSystemStatus, triggerSystemUpdate } from '../controllers/admin.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Ensure all routes are protected and require ADMIN role
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.patch('/users/:id/status', updateUserStatus);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/password', resetUserPassword);
router.post('/users/:id/subscription', manageSubscription);
router.get('/system/status', getSystemStatus);
router.post('/system/update', triggerSystemUpdate);

export default router;
