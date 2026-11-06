import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getRewardsDashboard,
  redeemReward,
  getTransactions,
  adminAdjustPoints,
} from '../controllers/rewardController.js';

const router = express.Router();

router.use(protect); // All routes require authentication

router.get('/dashboard', getRewardsDashboard);
router.post('/redeem', redeemReward);
router.get('/transactions', getTransactions);

// Admin controls
router.post('/admin/adjust', authorize('admin'), adminAdjustPoints);

export default router;

