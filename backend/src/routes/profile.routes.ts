import { Router } from 'express';
import { getProfile, updateProfile, testSmtpConnection, testSMSConnection } from '../controllers/profile.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticateToken);
router.get('/', getProfile);
router.put('/', upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }]), updateProfile);
router.post('/test-smtp', testSmtpConnection);
router.post('/test-sms', testSMSConnection);

export default router;
