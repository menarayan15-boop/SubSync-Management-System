import express from 'express';
import {
  getPassportSummary,
  completeResource,
  updatePassportPrivacy,
  getPublicPassport,
  downloadCertificatePdf,
} from '../controllers/passportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/public/:idOrMemberId', getPublicPassport);
router.get('/certificate/:certId/download', downloadCertificatePdf);

// Protected routes
router.use(protect);
router.get('/summary', getPassportSummary);
router.post('/complete/:resourceId', completeResource);
router.put('/privacy', updatePassportPrivacy);

export default router;

