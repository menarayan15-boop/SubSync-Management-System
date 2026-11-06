import express from 'express';
import {
  getPaymentConfig,
  createOrder,
  verifyPayment,
  handlePaymentFailure,
  getMyPayments,
  activateFreePlan,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/config', getPaymentConfig);
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.post('/failure', protect, handlePaymentFailure);
router.post('/activate-free', protect, activateFreePlan);
router.get('/my-payments', protect, getMyPayments);

export default router;
