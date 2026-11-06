import express from 'express';
import {
  createTicket,
  getMyTickets,
  getTicket,
  replyTicket,
} from '../controllers/supportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createTicket);
router.post('/tickets', createTicket);
router.get('/my-tickets', getMyTickets);
router.get('/:id', getTicket);
router.post('/:id/reply', replyTicket);

export default router;
