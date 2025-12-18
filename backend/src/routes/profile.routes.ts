import { Router } from 'express';
import { getProfile, updateProfile, testSmtpConnection } from '../controllers/profile.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticateToken);
router.get('/', getProfile);
router.put('/', upload.single('logo'), updateProfile);
router.post('/test-smtp', testSmtpConnection);

export default router;
