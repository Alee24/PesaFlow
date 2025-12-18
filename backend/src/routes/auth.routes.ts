
import { Router } from 'express';
import { register, login, updateUser } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.post('/register', upload.fields([
    { name: 'idFront', maxCount: 1 },
    { name: 'idBack', maxCount: 1 },
    { name: 'businessPermit', maxCount: 1 },
    { name: 'registrationCert', maxCount: 1 },
    { name: 'kraCert', maxCount: 1 }
]), register);
router.post('/login', login);
router.put('/me', authenticateToken, updateUser);

export default router;
