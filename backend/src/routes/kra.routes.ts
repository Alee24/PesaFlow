import { Router } from 'express';
import { getKRAVATReport } from '../controllers/kra-report.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.get('/vat-report', getKRAVATReport);

export default router;
