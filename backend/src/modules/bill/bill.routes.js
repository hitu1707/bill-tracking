import express from 'express';
import billController from './bill.controller.js';
import { authenticate } from '../../middleware/auth.js';
import upload from '../../middleware/upload.js';

const router = express.Router();

// All bill routes require authentication
router.use(authenticate);

// ─── 1. SPECIFIC NAMED ROUTES (MUST BE FIRST) ───
router.post('/scan', upload.single('billImage'), billController.scanBill);
router.get('/expiring-soon', billController.getExpiringBills);
router.get('/', billController.getAllBills);

// ─── 2. DYNAMIC ID ROUTES (MUST BE LAST) ───
router.get('/:id', billController.getBillById);
router.delete('/:id', billController.deleteBill);

export default router;