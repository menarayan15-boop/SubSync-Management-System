import express from 'express';
import {
  getResources,
  getResource,
  downloadResource,
  downloadResourceFile,
  getResourcePreview,
  getMyDownloads,
  createResource,
  updateResource,
  deleteResource,
  toggleBookmark,
  getBookmarkedResources,
  recordRecentlyViewed,
  getRecentlyViewedResources,
} from '../controllers/resourceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/my-downloads', protect, getMyDownloads);
router.get('/user/bookmarks', protect, getBookmarkedResources);
router.get('/user/recently-viewed', protect, getRecentlyViewedResources);

router.post('/:id/bookmark', protect, toggleBookmark);
router.post('/:id/view', protect, recordRecentlyViewed);
router.get('/:id/preview', getResourcePreview);
router.get('/:id/file', protect, downloadResourceFile);
router.post('/:id/download', protect, downloadResource);
router.get('/:id/download', protect, downloadResource);

router.route('/')
  .get(getResources)
  .post(protect, authorize('admin'), createResource);

router.route('/:id')
  .get(getResource)
  .put(protect, authorize('admin'), updateResource)
  .delete(protect, authorize('admin'), deleteResource);

export default router;
