import express from 'express';
import {
  getAdminOverview,
  getUsers,
  updateUserStatus,
  getAllPayments,
  refundPayment,
  getAllTickets,
  updateTicketStatus,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes here strictly require authentication and admin role
router.use(protect, authorize('admin'));

router.get('/overview', getAdminOverview);
router.get('/users', getUsers);
router.put('/users/:id', updateUserStatus);
router.get('/payments', getAllPayments);
router.post('/payments/:id/refund', refundPayment);
router.get('/tickets', getAllTickets);
router.put('/tickets/:id/status', updateTicketStatus);

export default router;
