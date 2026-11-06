import Invoice from '../models/Invoice.js';
import User from '../models/User.js';
import { renderInvoiceHtml } from '../services/invoiceService.js';

// @desc    Get current user's invoices
// @route   GET /api/invoices/my-invoices
// @access  Private
export const getMyInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({ user: req.user._id })
      .populate('payment', 'method status paymentId orderId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single invoice details
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('payment');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    // Security check: ensure invoice belongs to user or requester is admin
    if (invoice.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this invoice.' });
    }

    res.status(200).json({ success: true, invoice });
  } catch (err) {
    next(err);
  }
};

// @desc    Download / View printable HTML invoice
// @route   GET /api/invoices/:id/download
// @access  Private
export const downloadInvoiceHtml = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).send('Invoice not found');
    }

    const user = await User.findById(invoice.user);
    if (invoice.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).send('Unauthorized to access invoice');
    }

    const html = renderInvoiceHtml(invoice, user);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    next(err);
  }
};
