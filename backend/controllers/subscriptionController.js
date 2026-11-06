import Subscription from '../models/Subscription.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import Payment from '../models/Payment.js';
import DownloadHistory from '../models/DownloadHistory.js';
import Invoice from '../models/Invoice.js';
import { createNotification } from '../services/notificationService.js';
import { logActivity } from '../services/activityService.js';

// Helper: Check and auto-expire subscription if past expiry date
export const checkAndExpireSubscription = async (user, subscription) => {
  if (!subscription || subscription.status !== 'Active') return subscription;

  const now = new Date();
  if (subscription.endDate && new Date(subscription.endDate) < now) {
    // Subscription has expired
    subscription.status = 'Expired';
    await subscription.save();

    // Check if a downgrade plan was scheduled
    let targetPlan = null;
    if (subscription.scheduledDowngradePlan) {
      targetPlan = await SubscriptionPlan.findById(subscription.scheduledDowngradePlan);
    }
    if (!targetPlan) {
      targetPlan = await SubscriptionPlan.findOne({ slug: 'free' });
    }

    // Auto-create transition subscription to Free (or scheduled plan)
    const newSub = await Subscription.create({
      user: user._id,
      plan: targetPlan ? targetPlan._id : null,
      status: 'Active',
      startDate: now,
      endDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
      autoRenew: false,
      amount: 0,
      currency: 'INR',
    });

    await createNotification({
      userId: user._id,
      title: 'Subscription Period Ended',
      message: `Your previous subscription has reached its expiry date. Your account has transitioned to the ${targetPlan ? targetPlan.name : 'Free'} tier. All account history and records have been preserved.`,
      type: 'subscription',
      link: '/dashboard',
    });

    await logActivity({
      userId: user._id,
      action: 'EXPIRE',
      details: `Subscription expired automatically. Transitioned user to ${targetPlan ? targetPlan.name : 'Free'} plan.`,
    });

    return await Subscription.findById(newSub._id).populate('plan');
  }

  return subscription;
};

// @desc    Get user's active subscription (with auto-expiry check)
// @route   GET /api/subscriptions/my-subscription & GET /api/subscriptions/current
// @access  Private
export const getMySubscription = async (req, res, next) => {
  try {
    let subscription = await Subscription.findOne({
      user: req.user._id,
      status: 'Active',
    })
      .populate('plan')
      .populate('scheduledDowngradePlan')
      .sort({ createdAt: -1 });

    if (subscription) {
      subscription = await checkAndExpireSubscription(req.user, subscription);
    }

    if (!subscription) {
      // Find default Free Plan
      const freePlan = await SubscriptionPlan.findOne({ slug: 'free' });
      return res.status(200).json({
        success: true,
        subscription: {
          plan: freePlan,
          status: 'Active',
          startDate: req.user.createdAt,
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          remainingDays: 365,
          autoRenew: false,
        },
      });
    }

    res.status(200).json({
      success: true,
      subscription,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get subscription history
// @route   GET /api/subscriptions/history
// @access  Private
export const getSubscriptionHistory = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user._id })
      .populate('plan')
      .populate('scheduledDowngradePlan')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      subscriptions,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Schedule downgrade to lower plan for next billing cycle
// @route   POST /api/subscriptions/downgrade
// @access  Private
export const scheduleDowngrade = async (req, res, next) => {
  try {
    const { targetPlanId } = req.body;

    const targetPlan = await SubscriptionPlan.findById(targetPlanId);
    if (!targetPlan) {
      return res.status(404).json({ success: false, message: 'Target plan not found.' });
    }

    const currentSub = await Subscription.findOne({
      user: req.user._id,
      status: 'Active',
    }).populate('plan');

    if (!currentSub) {
      return res.status(404).json({ success: false, message: 'No active subscription found.' });
    }

    currentSub.scheduledDowngradePlan = targetPlan._id;
    await currentSub.save();

    await createNotification({
      userId: req.user._id,
      title: 'Downgrade Scheduled',
      message: `Your downgrade to ${targetPlan.name} is scheduled. Your current ${currentSub.plan.name} benefits remain fully active until ${new Date(currentSub.endDate).toLocaleDateString()}.`,
      type: 'subscription',
      link: '/dashboard',
    });

    await logActivity({
      userId: req.user._id,
      action: 'DOWNGRADE_SCHEDULED',
      details: `Scheduled downgrade to ${targetPlan.name} upon expiry.`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: `Downgrade to ${targetPlan.name} scheduled for end of active cycle. Current privileges preserved until expiry.`,
      subscription: currentSub,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel active subscription renewal
// @route   POST /api/subscriptions/cancel
// @access  Private
export const cancelSubscription = async (req, res, next) => {
  try {
    const { reason = 'User requested cancellation' } = req.body;

    const subscription = await Subscription.findOne({
      user: req.user._id,
      status: 'Active',
    }).populate('plan');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found to cancel.',
      });
    }

    if (subscription.plan && subscription.plan.slug === 'free') {
      return res.status(400).json({
        success: false,
        message: 'Free Plan is active by default and cannot be cancelled.',
      });
    }

    subscription.autoRenew = false;
    subscription.cancelledAt = new Date();
    subscription.cancellationReason = reason;
    await subscription.save();

    await createNotification({
      userId: req.user._id,
      title: 'Auto-Renewal Cancelled',
      message: `Auto-renewal for your ${subscription.plan ? subscription.plan.name : ''} plan has been cancelled. Your paid benefits remain active until ${new Date(subscription.endDate).toLocaleDateString()}.`,
      type: 'subscription',
      link: '/dashboard',
    });

    await logActivity({
      userId: req.user._id,
      action: 'CANCEL_RENEWAL',
      details: `User cancelled renewal. Reason: ${reason}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: 'Subscription renewal cancelled successfully. Access remains fully active until billing cycle concludes.',
      subscription,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get comprehensive user dashboard analytics from real MongoDB records
// @route   GET /api/subscriptions/analytics
// @access  Private
export const getUserAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Fetch user's subscription
    const subscription = await Subscription.findOne({
      user: userId,
      status: 'Active',
    }).populate('plan');

    // 2. Fetch payments & invoices
    const [payments, invoices, downloads] = await Promise.all([
      Payment.find({ user: userId, status: 'Successful' }).sort({ createdAt: 1 }),
      Invoice.find({ user: userId }).sort({ createdAt: -1 }),
      DownloadHistory.find({ user: userId }).populate('resource').sort({ createdAt: -1 }),
    ]);

    // 3. Calculate validity metrics
    const now = new Date();
    let totalDays = 30;
    let daysPassed = 0;
    let daysRemaining = 30;
    let validityPercentage = 100;

    if (subscription && subscription.startDate && subscription.endDate) {
      const start = new Date(subscription.startDate);
      const end = new Date(subscription.endDate);
      totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      daysPassed = Math.max(0, Math.ceil((now - start) / (1000 * 60 * 60 * 24)));
      daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
      validityPercentage = Math.min(100, Math.max(0, Math.round(((totalDays - daysRemaining) / totalDays) * 100)));
    }

    // 4. Monthly spending history (last 6 calendar months)
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString('en-US', { month: 'short' }),
        year: d.getFullYear(),
        amount: 0,
      });
    }

    payments.forEach((p) => {
      const pDate = new Date(p.createdAt);
      const pKey = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`;
      const found = months.find((m) => m.key === pKey);
      if (found) {
        found.amount += Number(p.amount) || 0;
      }
    });

    // 5. Daily download activity (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      last7Days.push({
        date: dateString,
        day: dayName,
        count: 0,
      });
    }

    downloads.forEach((dl) => {
      if (dl.createdAt) {
        const dlDate = new Date(dl.createdAt).toISOString().split('T')[0];
        const match = last7Days.find((day) => day.date === dlDate);
        if (match) {
          match.count += 1;
        }
      }
    });

    // 6. Category breakdown from actual downloads
    const categoryCounts = {};
    downloads.forEach((dl) => {
      const cat = dl.resource?.category || dl.category || 'General';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const categoryBreakdown = Object.keys(categoryCounts).map((cat) => ({
      category: cat,
      count: categoryCounts[cat],
      percentage: Math.round((categoryCounts[cat] / Math.max(1, downloads.length)) * 100),
    }));

    // Total spent
    const totalSpent = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    res.status(200).json({
      success: true,
      analytics: {
        summary: {
          totalSpent,
          totalInvoices: invoices.length,
          totalDownloads: downloads.length,
          dailyDownloadsUsed: req.user.usageQuota?.dailyDownloadsUsed || 0,
          dailyLimit: subscription?.plan?.dailyDownloadLimit ?? 1,
        },
        validity: {
          totalDays,
          daysPassed,
          daysRemaining,
          validityPercentage,
          status: subscription?.status || 'Active',
          tierName: subscription?.plan?.name || 'Free',
          tierLevel: subscription?.plan?.tierLevel ?? 0,
          endDate: subscription?.endDate || null,
        },
        spendingTrends: months,
        downloadTrends: last7Days,
        categoryBreakdown,
      },
    });
  } catch (err) {
    next(err);
  }
};
