
import { Router } from 'express';
import { getNotifications, markRead } from '../controllers/notification.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getNotifications);
router.post('/read', markRead);

export default router;
