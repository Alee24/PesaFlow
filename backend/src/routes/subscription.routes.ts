
import { Router } from 'express';
import { getSubscription, initiateSubscription } from '../controllers/subscription.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateUser);

router.get('/', getSubscription);
router.post('/pay', initiateSubscription);

export default router;
