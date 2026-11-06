import express from 'express';
import {
  getMembershipCard,
  verifyMembershipToken,
} from '../controllers/membershipController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Private: Authenticated member fetches their card & signed token
router.get('/card', protect, getMembershipCard);

// Public: QR Code scanner or public verification URL checks validity
router.get('/verify/:token?', verifyMembershipToken);
router.get('/verify', verifyMembershipToken);

export default router;

