import { Router } from 'express';
import { createInvoice, getInvoices } from '../controllers/invoice.controller';
import { authenticateToken, requireActive } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.post('/', requireActive, createInvoice);
router.get('/', getInvoices);

export default router;
