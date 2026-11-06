import express from 'express';
import {
  getMyInvoices,
  getInvoice,
  downloadInvoiceHtml,
} from '../controllers/invoiceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/my-invoices', protect, getMyInvoices);
router.get('/:id', protect, getInvoice);
router.get('/:id/download', protect, downloadInvoiceHtml);

export default router;
