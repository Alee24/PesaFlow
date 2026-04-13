
import { Router } from 'express';
import { initiateBankTransfer, getBanksList, testBankConnection } from '../controllers/bank.controller';
import { authenticateToken, requireActive } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.use(requireActive);

router.post('/transfer', initiateBankTransfer);
router.get('/list', getBanksList);
router.post('/test', testBankConnection);

export default router;
