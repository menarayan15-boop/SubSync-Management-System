import express from 'express';
import {
  getSubscriptionAdvice,
  getWasteDetectorAnalysis,
  simulateCost,
} from '../controllers/intelligenceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/advisor', getSubscriptionAdvice);
router.get('/waste-detector', getWasteDetectorAnalysis);
router.post('/simulate-cost', simulateCost);

export default router;

