import SupportTicket from '../models/SupportTicket.js';
import { createNotification } from '../services/notificationService.js';
import { logActivity } from '../services/activityService.js';

// @desc    Create support ticket
// @route   POST /api/support
// @access  Private
export const createTicket = async (req, res, next) => {
  try {
    const { category, subject, priority, attachments = [] } = req.body;
    const description = req.body.description || req.body.message;

    if (!subject || !description) {
      return res.status(400).json({ success: false, message: 'Please provide subject and description or message.' });
    }

    let cleanCategory = category || 'Billing & Invoicing';
    const catLower = cleanCategory.toLowerCase();
    if (catLower.includes('bill')) cleanCategory = 'Billing & Invoicing';
    else if (catLower.includes('sub')) cleanCategory = 'Subscription Upgrade/Downgrade';
    else if (catLower.includes('res')) cleanCategory = 'Resource Access';
    else if (catLower.includes('sec')) cleanCategory = 'Account Security';
    else if (catLower.includes('tech')) cleanCategory = 'Technical Support';
    else if (!['Billing & Invoicing', 'Subscription Upgrade/Downgrade', 'Resource Access', 'Account Security', 'Technical Support', 'Other'].includes(cleanCategory)) {
      cleanCategory = 'Other';
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    const cleanPriority = validPriorities.includes(priority?.toLowerCase()) ? priority.toLowerCase() : 'medium';

    const ticketNumber = `TICK-${Date.now().toString().slice(-6)}`;

    const ticket = await SupportTicket.create({
      user: req.user._id,
      ticketNumber,
      category: cleanCategory,
      subject,
      description,
      priority: cleanPriority,
      status: 'Open',
      attachments,
      responses: [
        {
          user: req.user._id,
          userName: req.user.name,
          message: description,
          isAdmin: false,
          createdAt: new Date(),
        },
      ],
    });

    await logActivity({
      userId: req.user._id,
      action: 'SUPPORT_TICKET',
      details: `Created support ticket ${ticketNumber}: ${subject}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully. Our helpdesk team will respond shortly.',
      ticket,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's tickets
// @route   GET /api/support/my-tickets
// @access  Private
export const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, count: tickets.length, tickets });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single ticket
// @route   GET /api/support/:id
// @access  Private
export const getTicket = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id).populate('user', 'name email role avatar');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    // Ensure user owns ticket or user is admin
    if (ticket.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
};

// @desc    Add reply message to ticket
// @route   POST /api/support/:id/reply
// @access  Private
export const replyTicket = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Reply message cannot be empty.' });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const isAdmin = req.user.role === 'admin';

    // Verify ownership if not admin
    if (!isAdmin && ticket.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    ticket.responses.push({
      user: req.user._id,
      userName: req.user.name,
      message,
      isAdmin,
      createdAt: new Date(),
    });

    // Update status if replied by admin
    if (isAdmin && ticket.status === 'Open') {
      ticket.status = 'In Progress';
    }

    await ticket.save();

    // Notify ticket owner if reply is by Admin
    if (isAdmin) {
      await createNotification({
        userId: ticket.user,
        title: `Reply on ticket ${ticket.ticketNumber}`,
        message: `Support team replied: "${message.slice(0, 80)}..."`,
        type: 'system',
        link: `/support/${ticket._id}`,
      });
    }

    res.status(200).json({ success: true, message: 'Reply sent.', ticket });
  } catch (err) {
    next(err);
  }
};
