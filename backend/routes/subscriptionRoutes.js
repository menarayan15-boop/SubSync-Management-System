import express from 'express';
import {
  getMySubscription,
  getSubscriptionHistory,
  scheduleDowngrade,
  cancelSubscription,
  getUserAnalytics,
} from '../controllers/subscriptionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/my-subscription', protect, getMySubscription);
router.get('/current', protect, getMySubscription);
router.get('/history', protect, getSubscriptionHistory);
router.get('/analytics', protect, getUserAnalytics);
router.post('/downgrade', protect, scheduleDowngrade);
router.post('/cancel', protect, cancelSubscription);

export default router;
