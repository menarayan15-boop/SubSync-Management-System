import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getCancellationGuides,
  getCancellationWorkflows,
  startCancellationWorkflow,
  updateCancellationStatus,
  uploadCancellationEvidence,
  streamCancellationEvidence,
  evidenceUpload,
  deleteCancellationWorkflow,
} from '../controllers/cancellationController.js';

const router = express.Router();

router.use(protect); // All routes require authentication

router.get('/guides', getCancellationGuides);
router.get('/workflows', getCancellationWorkflows);
router.post('/start', startCancellationWorkflow);
router.put('/:id/status', updateCancellationStatus);
router.post('/:id/evidence', evidenceUpload.single('evidence'), uploadCancellationEvidence);
router.get('/:id/evidence-file', streamCancellationEvidence);
router.delete('/:id', deleteCancellationWorkflow);

export default router;

