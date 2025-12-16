import { Router } from 'express';
import { createInvoice } from '../controllers/invoice.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.post('/', createInvoice);

export default router;
