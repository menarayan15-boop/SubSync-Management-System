import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getBudgetOverview,
  updateBudgetSettings,
  simulateBudget,
  exportCsvReport,
  exportPdfReport,
} from '../controllers/budgetController.js';

const router = express.Router();

router.use(protect); // All routes require authentication

router.get('/', getBudgetOverview);
router.put('/settings', updateBudgetSettings);
router.post('/simulate', simulateBudget);
router.get('/export/csv', exportCsvReport);
router.get('/export/pdf', exportPdfReport);

export default router;

