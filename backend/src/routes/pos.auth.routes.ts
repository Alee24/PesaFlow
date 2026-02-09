import express from 'express';
import { getStaffList, verifyPin } from '../controllers/pos.auth.controller';
import { authenticateToken, requireActive } from '../middlewares/auth.middleware';

const router = express.Router();

// Get list of staff (Requires specific Merchant Login to "Unlock/Authorize" the device)
router.get('/staff', authenticateToken, requireActive, getStaffList);

// Login with PIN (Does NOT require headers, just the ID and PIN)
router.post('/verify-pin', verifyPin);

export default router;
