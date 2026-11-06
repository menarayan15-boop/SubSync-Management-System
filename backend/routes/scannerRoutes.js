import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  documentUpload,
  uploadAndScanDocument,
  getScannerDashboard,
  getScannedDocuments,
  streamDocumentFile,
  confirmAndSaveSubscription,
  deleteScannedDocument,
} from '../controllers/scannerController.js';

const router = express.Router();

router.use(protect); // All scanner routes require authentication

router.post('/upload', documentUpload.single('document'), uploadAndScanDocument);
router.get('/dashboard', getScannerDashboard);
router.get('/documents', getScannedDocuments);
router.get('/document/:id/file', streamDocumentFile);
router.post('/confirm/:id', confirmAndSaveSubscription);
router.delete('/document/:id', deleteScannedDocument);

export default router;

