import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { createTicket, getTickets, getTicket, replyTicket } from '../controllers/support.controller';

const router = Router();

router.use(authenticateToken);

router.post('/', createTicket);
router.get('/', getTickets);
router.get('/:id', getTicket);
router.post('/:id/reply', replyTicket);

export default router;
