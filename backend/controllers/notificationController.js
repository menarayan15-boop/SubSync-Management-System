import Notification from '../models/Notification.js';
import Subscription from '../models/Subscription.js';

// Internal helper to create notifications safely without duplicating recent ones
export const createNotificationHelper = async ({
  userId,
  title,
  message,
  category = 'system',
  type = 'system',
  link = '',
  metadata = {},
}) => {
  try {
    // Avoid creating duplicate notification with same title & category within 24h
    const existing = await Notification.findOne({
      user: userId,
      title,
      category,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    if (existing) return existing;

    return await Notification.create({
      user: userId,
      title,
      message,
      category,
      type,
      link,
      metadata,
    });
  } catch (err) {
    console.error('Failed to create notification helper:', err.message);
    return null;
  }
};

// @desc    Get current user notifications
// @route   GET /api/notifications
// @access  Private
export const getMyNotifications = async (req, res, next) => {
  try {
    // 1. Automated Background Check for Expiration / Renewal Notifications
    try {
      const activeSub = await Subscription.findOne({
        user: req.user._id,
        status: 'Active',
      }).populate('plan');

      if (activeSub && activeSub.endDate) {
        const daysRemaining = Math.ceil((new Date(activeSub.endDate) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysRemaining <= 3 && daysRemaining > 0) {
          await createNotificationHelper({
            userId: req.user._id,
            title: 'Subscription Renewal Reminder',
            message: `Your ${activeSub.plan?.name || 'SubSync'} membership expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}. Renew now to maintain unhindered vault access.`,
            category: 'renewal',
            type: 'subscription',
            link: '/plans',
            metadata: { subscriptionId: activeSub._id, daysRemaining },
          });
        } else if (daysRemaining <= 0) {
          await createNotificationHelper({
            userId: req.user._id,
            title: 'Subscription Expiration Warning',
            message: `Your ${activeSub.plan?.name || 'SubSync'} membership has reached its end date. Your account will transition to Free tier privileges.`,
            category: 'expiration',
            type: 'subscription',
            link: '/plans',
            metadata: { subscriptionId: activeSub._id },
          });
        }
      }
    } catch (checkErr) {
      // Non-blocking reminder check
    }

    // 2. Query filters
    const filter = { user: req.user._id };
    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }
    if (req.query.unreadOnly === 'true') {
      filter.isRead = false;
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 30;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: req.user._id, isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      unreadCount,
      total,
      page,
      pages: Math.ceil(total / limit),
      notifications,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    res.status(200).json({ success: true, notification });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark all user notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.status(200).json({ success: true, message: 'Notification removed.' });
  } catch (err) {
    next(err);
  }
};
