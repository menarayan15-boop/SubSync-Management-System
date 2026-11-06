import express from 'express';
import {
  getMyGroup,
  createGroup,
  inviteMember,
  previewInvitation,
  acceptInvitation,
  removeMember,
  revokeInvitation,
  getAllGroupsAdmin,
} from '../controllers/teamController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public: preview invitation details
router.get('/invite/:token', previewInvitation);

// Protected routes
router.use(protect);
router.get('/my-group', getMyGroup);
router.post('/create', createGroup);
router.post('/invite', inviteMember);
router.post('/accept-invite', acceptInvitation);
router.delete('/members/:memberId', removeMember);
router.delete('/invites/:inviteId', revokeInvitation);

// Admin route
router.get('/admin/all', authorize('admin'), getAllGroupsAdmin);

export default router;

