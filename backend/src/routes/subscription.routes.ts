
import { Router } from 'express';
import { getSubscription, initiateSubscription } from '../controllers/subscription.controller';
import { authenticateUser } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateUser);

router.get('/', getSubscription);
router.post('/pay', initiateSubscription);

export default router;
