import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import Payment from '../models/Payment.js';
import Resource from '../models/Resource.js';
import DownloadHistory from '../models/DownloadHistory.js';
import SupportTicket from '../models/SupportTicket.js';
import ActivityLog from '../models/ActivityLog.js';
import Invoice from '../models/Invoice.js';

// @desc    Get comprehensive admin overview metrics & analytics
// @route   GET /api/admin/overview
// @access  Private/Admin
export const getAdminOverview = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeSubscribers = await Subscription.countDocuments({ status: 'Active' });

    // Free plan users vs Paid subscribers
    const freePlan = await SubscriptionPlan.findOne({ slug: 'free' });
    const freePlanId = freePlan ? freePlan._id : null;

    const freeUsersCount = await Subscription.countDocuments({
      status: 'Active',
      plan: freePlanId,
    });
    const paidUsersCount = Math.max(0, activeSubscribers - freeUsersCount);

    // Revenue calculations
    const successfulPayments = await Payment.find({ status: 'Successful' });
    const totalRevenue = successfulPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyPayments = successfulPayments.filter((p) => new Date(p.createdAt) >= startOfMonth);
    const monthlyRevenue = monthlyPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const totalTransactions = await Payment.countDocuments();
    const failedPayments = await Payment.countDocuments({ status: 'Failed' });

    // Expiring subscriptions (within next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const expiringSubscriptions = await Subscription.countDocuments({
      status: 'Active',
      endDate: { $gte: now, $lte: nextWeek },
    });

    // Plan distribution
    const plans = await SubscriptionPlan.find({ isActive: true });
    const planDistribution = await Promise.all(
      plans.map(async (plan) => {
        const count = await Subscription.countDocuments({ plan: plan._id, status: 'Active' });
        return {
          name: plan.name,
          count,
          tierLevel: plan.tierLevel,
        };
      })
    );

    // Monthly revenue trend (last 6 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRevenueTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const sum = successfulPayments
        .filter((p) => new Date(p.createdAt) >= d && new Date(p.createdAt) < nextD)
        .reduce((acc, curr) => acc + curr.amount, 0);

      monthlyRevenueTrend.push({
        month: `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`,
        revenue: sum,
      });
    }

    // Recent activity
    const recentActivities = await ActivityLog.find()
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(8);

    res.status(200).json({
      success: true,
      metrics: {
        totalUsers,
        activeSubscribers,
        freeUsers: freeUsersCount,
        paidSubscribers: paidUsersCount,
        totalRevenue,
        monthlyRevenue,
        totalTransactions,
        failedPayments,
        expiringSubscriptions,
        openTickets: await SupportTicket.countDocuments({ status: 'Open' }),
        totalResources: await Resource.countDocuments(),
        totalDownloads: await DownloadHistory.countDocuments(),
      },
      planDistribution,
      monthlyRevenueTrend,
      recentActivities,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all users with search and filter
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const { search, role, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role && role !== 'All') {
      query.role = role;
    }

    if (status && status !== 'All') {
      query.isActive = status === 'Active';
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    // Attach active subscription to each user
    const usersWithSubscriptions = await Promise.all(
      users.map(async (u) => {
        const sub = await Subscription.findOne({ user: u._id, status: 'Active' }).populate('plan', 'name tierLevel');
        return {
          ...u.toObject(),
          currentPlan: sub && sub.plan ? sub.plan.name : 'Free',
          subscriptionStatus: sub ? sub.status : 'Active',
        };
      })
    );

    res.status(200).json({
      success: true,
      count: usersWithSubscriptions.length,
      users: usersWithSubscriptions,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user status (block/unblock or role)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
export const updateUserStatus = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all transactions / payments
// @route   GET /api/admin/payments
// @access  Private/Admin
export const getAllPayments = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { paymentId: { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const payments = await Payment.find(query)
      .populate('user', 'name email')
      .populate('plan', 'name tierLevel')
      .populate('invoice')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Process refund on payment
// @route   POST /api/admin/payments/:id/refund
// @access  Private/Admin
export const refundPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (payment.status !== 'Successful') {
      return res.status(400).json({ success: false, message: 'Only successful payments can be refunded.' });
    }

    payment.status = 'Refunded';
    await payment.save();

    // Cancel related subscription if exists
    if (payment.subscription) {
      await Subscription.findByIdAndUpdate(payment.subscription, {
        status: 'Cancelled',
        cancellationReason: 'Payment refunded by Administrator',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment refunded successfully.',
      payment,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all support tickets for admin
// @route   GET /api/admin/tickets
// @access  Private/Admin
export const getAllTickets = async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const query = {};

    if (status && status !== 'All') query.status = status;
    if (category && category !== 'All') query.category = category;

    const tickets = await SupportTicket.find(query)
      .populate('user', 'name email role')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update support ticket status
// @route   PUT /api/admin/tickets/:id/status
// @access  Private/Admin
export const updateTicketStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    res.status(200).json({
      success: true,
      message: `Ticket status changed to ${status}.`,
      ticket,
    });
  } catch (err) {
    next(err);
  }
};
