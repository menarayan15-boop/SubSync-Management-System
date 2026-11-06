import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getDiscoveryServices,
  getDiscoveryServiceById,
  compareServices,
  getUserWishlist,
  toggleWishlistService,
  trackDiscoveryService,
  reportServiceDiscrepancy,
  adminCreateService,
} from '../controllers/discoveryController.js';

const router = express.Router();

// Public discovery routes
router.get('/services', getDiscoveryServices);
router.get('/services/:id', getDiscoveryServiceById);
router.post('/compare', compareServices);

// Authenticated user interaction routes
router.get('/wishlist', protect, getUserWishlist);
router.post('/wishlist/toggle', protect, toggleWishlistService);
router.post('/track/:id', protect, trackDiscoveryService);
router.post('/report', protect, reportServiceDiscrepancy);

// Admin service management
router.post('/admin/service', protect, authorize('admin'), adminCreateService);

export default router;

