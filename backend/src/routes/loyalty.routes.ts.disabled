import { Router } from 'express';
import {
    registerCustomer,
    getCustomer,
    searchCustomer,
    earnPoints,
    redeemPoints,
    getCustomerHistory,
    getAllCustomers
} from '../controllers/loyalty.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Customer management
router.post('/customers', registerCustomer);
router.get('/customers', getAllCustomers);
router.get('/customers/search', searchCustomer);
router.get('/customers/:id', getCustomer);
router.get('/customers/:id/history', getCustomerHistory);

// Points operations
router.post('/earn', earnPoints);
router.post('/redeem', redeemPoints);

export default router;
