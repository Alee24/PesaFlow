
import { Router } from 'express';
import { register, login, updateUser } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.put('/me', authenticateToken, updateUser);

export default router;
