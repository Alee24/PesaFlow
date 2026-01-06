import { Router } from 'express';
import { createInvoice, getInvoices, sendInvoiceEmail } from '../controllers/invoice.controller';
import { authenticateToken, requireActive } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.post('/', requireActive, createInvoice);
router.post('/:id/email', sendInvoiceEmail);
router.get('/', getInvoices);

export default router;
