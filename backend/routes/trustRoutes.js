import express from 'express';
import {
  getTrustOverview,
  exportPersonalData,
  requestAccountDeletion,
  revokeSessions,
} from '../controllers/trustController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/overview', getTrustOverview);
router.get('/export-data', exportPersonalData);
router.post('/request-deletion', requestAccountDeletion);
router.post('/revoke-sessions', revokeSessions);

export default router;

