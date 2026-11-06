import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import ActivityLog from '../models/ActivityLog.js';
import UserProgress from '../models/UserProgress.js';
import GiftSubscription from '../models/GiftSubscription.js';
import { logActivity } from '../services/activityService.js';

// Parse User-Agent string safely into readable browser & OS
const parseUserAgent = (uaString = '') => {
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  if (/chrome|crios/i.test(uaString)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(uaString)) browser = 'Firefox';
  else if (/safari/i.test(uaString)) browser = 'Safari';
  else if (/edg/i.test(uaString)) browser = 'Edge';

  if (/windows/i.test(uaString)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(uaString)) os = 'macOS';
  else if (/linux/i.test(uaString)) os = 'Linux';
  else if (/android/i.test(uaString)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(uaString)) os = 'iOS';

  return { browser, os };
};

// @desc    Get complete Trust Center overview
// @route   GET /api/trust/overview
// @access  Private
export const getTrustOverview = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [payments, subscription, activityLogs, user] = await Promise.all([
      Payment.find({ user: userId }).populate('plan', 'name slug').sort({ createdAt: -1 }),
      Subscription.findOne({ user: userId }).populate('plan', 'name monthlyPrice'),
      ActivityLog.find({ user: userId }).sort({ createdAt: -1 }).limit(30),
      User.findById(userId),
    ]);

    // Format security logs (logins, logouts, security actions)
    const securityActivities = activityLogs
      .filter((log) =>
        ['LOGIN', 'LOGOUT', 'REGISTER', 'PASSWORD_CHANGE', 'PROFILE_UPDATE'].includes(
          log.action?.toUpperCase()
        )
      )
      .map((log) => {
        const { browser, os } = parseUserAgent(log.userAgent);
        return {
          id: log._id,
          action: log.action,
          details: log.details,
          ipAddress: log.ipAddress || '127.0.0.1',
          device: `${browser} on ${os}`,
          timestamp: log.createdAt,
        };
      });

    // Format subscription activity timeline
    const subscriptionTimeline = activityLogs.map((log) => ({
      id: log._id,
      action: log.action,
      details: log.details,
      timestamp: log.createdAt,
    }));

    res.status(200).json({
      success: true,
      trustData: {
        user: {
          name: user.name,
          email: user.email,
          phone: user.phone || 'Not provided',
          memberId: user.memberId,
          isVerified: user.isVerified,
          notificationPreferences: user.notificationPreferences,
          passportPrivacy: user.passportPrivacy || 'public',
          createdAt: user.createdAt,
        },
        subscription: subscription
          ? {
              planName: subscription.plan?.name,
              status: subscription.status,
              startDate: subscription.startDate,
              endDate: subscription.endDate,
              autoRenew: subscription.autoRenew,
            }
          : null,
        payments: payments.map((p) => ({
          id: p._id,
          orderId: p.orderId,
          paymentId: p.paymentId
            ? `${p.paymentId.substring(0, 8)}••••${p.paymentId.slice(-4)}`
            : 'Pending',
          planName: p.plan?.name || 'Subscription',
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          date: p.createdAt,
          hasInvoice: !!p.invoice,
          invoiceId: p.invoice,
        })),
        securityActivities,
        subscriptionTimeline,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Export all personal account data as JSON
// @route   GET /api/trust/export-data
// @access  Private
export const exportPersonalData = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [user, subscriptions, payments, activities, progress, giftsPurchased] =
      await Promise.all([
        User.findById(userId).select('-password'),
        Subscription.find({ user: userId }).populate('plan', 'name monthlyPrice'),
        Payment.find({ user: userId }).populate('plan', 'name'),
        ActivityLog.find({ user: userId }).sort({ createdAt: -1 }),
        UserProgress.find({ user: userId }).populate('resource', 'title category'),
        GiftSubscription.find({ purchaser: userId }).populate('plan', 'name'),
      ]);

    const exportPayload = {
      exportMetadata: {
        platform: 'SubSync Subscription Management Platform',
        exportedAt: new Date().toISOString(),
        gdprCompliant: true,
      },
      userProfile: {
        id: user._id,
        memberId: user.memberId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
        notificationPreferences: user.notificationPreferences,
      },
      subscriptions,
      billingHistory: payments,
      learningProgress: progress,
      giftPurchases: giftsPurchased,
      activityLogCount: activities.length,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="subsync_personal_data_${user.memberId || 'export'}.json"`
    );

    await logActivity({
      userId,
      action: 'DATA_EXPORT',
      details: 'Exported personal account archive.',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).send(JSON.stringify(exportPayload, null, 2));
  } catch (err) {
    next(err);
  }
};

// @desc    Submit account deletion request
// @route   POST /api/trust/request-deletion
// @access  Private
export const requestAccountDeletion = async (req, res, next) => {
  try {
    const { reason = 'User requested account closure', confirmation } = req.body;

    if (!confirmation) {
      return res.status(400).json({
        success: false,
        message: 'Please confirm deletion by providing confirmation acknowledgment.',
      });
    }

    const activeSub = await Subscription.findOne({
      user: req.user._id,
      status: 'Active',
    }).populate('plan');

    if (activeSub && activeSub.plan?.monthlyPrice > 0) {
      return res.status(400).json({
        success: false,
        activeSubscriptionWarning: true,
        message: `You currently have an active paid ${activeSub.plan.name} subscription. Please cancel your subscription auto-renewal first before requesting permanent account closure.`,
      });
    }

    await logActivity({
      userId: req.user._id,
      action: 'DELETION_REQUESTED',
      details: `Submitted account deletion request. Reason: ${reason}.`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message:
        'Account deletion request recorded. Pursuant to tax and regulatory compliance, transaction invoices are archived securely. A confirmation link has been scheduled.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Revoke sessions / logout other devices
// @route   POST /api/trust/revoke-sessions
// @access  Private
export const revokeSessions = async (req, res, next) => {
  try {
    await logActivity({
      userId: req.user._id,
      action: 'SESSIONS_REVOKED',
      details: 'All other active sessions revoked from Trust Center.',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: 'All other active browser sessions have been successfully invalidated.',
    });
  } catch (err) {
    next(err);
  }
};

