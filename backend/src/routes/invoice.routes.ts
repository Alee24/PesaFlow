import { Router } from 'express';
import { createInvoice, getInvoices } from '../controllers/invoice.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.post('/', createInvoice);
router.get('/', getInvoices);

export default router;
