
import { Router } from 'express';
import { getSubscription, initiateSubscription } from '../controllers/subscription.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', getSubscription);
router.post('/', authenticateToken, initiateSubscription);

export default router;
