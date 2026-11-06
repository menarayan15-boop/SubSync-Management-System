import express from 'express';
import {
  createGiftOrder,
  verifyGiftPayment,
  getMyPurchasedGifts,
  previewGiftCode,
  redeemGiftCode,
  getAllGiftsAdmin,
} from '../controllers/giftController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public: Preview code before logging in / redeeming
router.get('/preview/:code', previewGiftCode);

// Protected user routes
router.use(protect);
router.post('/create-order', createGiftOrder);
router.post('/verify-payment', verifyGiftPayment);
router.get('/my-gifts', getMyPurchasedGifts);
router.post('/redeem', redeemGiftCode);

// Admin route
router.get('/admin/all', authorize('admin'), getAllGiftsAdmin);

export default router;

