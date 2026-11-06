import SubscriptionPlan from '../models/SubscriptionPlan.js';
import Subscription from '../models/Subscription.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  fetchRazorpayPaymentDetails,
  getRazorpayKeyId,
} from '../services/razorpayService.js';
import { createInvoiceRecord } from '../services/invoiceService.js';
import { createNotification } from '../services/notificationService.js';
import { logActivity } from '../services/activityService.js';

// @desc    Get Razorpay public key
// @route   GET /api/payments/config
// @access  Public
export const getPaymentConfig = async (req, res) => {
  res.status(200).json({
    success: true,
    keyId: getRazorpayKeyId(),
  });
};

// @desc    Initiate Razorpay payment order
// @route   POST /api/payments/create-order
// @access  Private
export const createOrder = async (req, res, next) => {
  try {
    const { planId, billingCycle = 'monthly' } = req.body;

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found.' });
    }

    // Determine amount based on billing cycle
    let amount = plan.monthlyPrice;
    if (billingCycle === 'quarterly') amount = plan.quarterlyPrice;
    if (billingCycle === 'yearly') amount = plan.yearlyPrice;

    // If Free plan (0 amount)
    if (amount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Free plan does not require payment checkout. Activate directly.',
      });
    }

    const orderData = await createRazorpayOrder({
      amount,
      currency: plan.currency || 'INR',
      receipt: `rcpt_${Date.now().toString().slice(-8)}`,
    });

    // Save pending payment record in DB
    const payment = await Payment.create({
      user: req.user._id,
      plan: plan._id,
      orderId: orderData.id,
      amount,
      currency: orderData.currency,
      status: 'Pending',
      billingCycle,
    });

    res.status(200).json({
      success: true,
      orderId: orderData.id,
      amount: orderData.amount, // in paise
      actualAmount: amount, // in rupees
      currency: orderData.currency,
      keyId: orderData.keyId || getRazorpayKeyId(),
      planName: plan.name,
      billingCycle,
      paymentId: payment._id,
    });
  } catch (err) {
    if (err.code === 'RAZORPAY_CONFIG_REQUIRED' || err.code === 'NETWORK_CONNECTIVITY_ERROR') {
      return res.status(503).json({
        success: false,
        code: err.code,
        message: err.message,
      });
    }
    if (err.code === 'RAZORPAY_AUTH_FAILED' || err.statusCode === 401) {
      return res.status(401).json({
        success: false,
        code: 'RAZORPAY_AUTH_FAILED',
        message: err.message,
      });
    }
    return res.status(err.statusCode || 400).json({
      success: false,
      code: err.code || 'RAZORPAY_ORDER_FAILED',
      message: err.message,
      details: err.details || null,
    });
  }
};

// @desc    Verify Razorpay payment signature & activate subscription
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, paymentId, signature, planId, billingCycle = 'monthly' } = req.body;

    if (!orderId || !paymentId) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_PARAMS',
        message: 'Order ID and Payment ID are required.',
      });
    }

    // 1. Idempotency Check: reject duplicate verified payments
    const existingPayment = await Payment.findOne({ paymentId, status: 'Successful' });
    if (existingPayment) {
      return res.status(409).json({
        success: false,
        code: 'DUPLICATE_PAYMENT',
        message: 'This payment transaction has already been verified and processed.',
        subscriptionId: existingPayment.subscription,
      });
    }

    // 2. Verify signature using official Razorpay HMAC-SHA256
    const isValid = verifyRazorpaySignature({ orderId, paymentId, signature });

    if (!isValid) {
      // Mark payment as failed in DB
      await Payment.findOneAndUpdate(
        { orderId },
        { status: 'Failed', failureReason: 'Cryptographic signature mismatch', paymentId }
      );

      await createNotification({
        userId: req.user._id,
        title: 'Payment Verification Failed',
        message: 'Cryptographic signature mismatch. Your payment could not be validated.',
        type: 'payment',
        link: '/billing',
      });

      return res.status(400).json({
        success: false,
        code: 'INVALID_SIGNATURE',
        message: 'Payment verification failed: invalid signature.',
      });
    }

    // 3. Optional remote capture verification with Razorpay SDK
    try {
      const paymentDetails = await fetchRazorpayPaymentDetails(paymentId);
      if (
        paymentDetails &&
        paymentDetails.status !== 'captured' &&
        paymentDetails.status !== 'authorized'
      ) {
        await Payment.findOneAndUpdate(
          { orderId },
          {
            status: 'Failed',
            failureReason: `Payment status is ${paymentDetails.status}, expected captured`,
            paymentId,
          }
        );

        return res.status(400).json({
          success: false,
          code: 'PAYMENT_NOT_CAPTURED',
          message: `Payment status is ${paymentDetails.status}, expected captured or authorized.`,
        });
      }
    } catch (fetchErr) {
      // If Razorpay API fetch encounters network issues but signature is valid, proceed or log
      console.warn('[Payment] Warning during remote status check:', fetchErr.message);
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }

    // Determine duration
    const startDate = new Date();
    const endDate = new Date(startDate);
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else if (billingCycle === 'quarterly') {
      endDate.setDate(endDate.getDate() + 90);
    } else {
      endDate.setDate(endDate.getDate() + 30);
    }

    // Supersede any current active subscriptions
    await Subscription.updateMany(
      { user: req.user._id, status: 'Active' },
      { status: 'Expired' }
    );

    // Calculate actual amount
    let amount = plan.monthlyPrice;
    if (billingCycle === 'quarterly') amount = plan.quarterlyPrice;
    if (billingCycle === 'yearly') amount = plan.yearlyPrice;

    // Create new active subscription
    const subscription = await Subscription.create({
      user: req.user._id,
      plan: plan._id,
      billingCycle,
      status: 'Active',
      startDate,
      endDate,
      nextBillingDate: endDate,
      amount,
      currency: plan.currency || 'INR',
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      autoRenew: true,
    });

    // Update payment record to Successful
    let payment = await Payment.findOne({ orderId });
    if (!payment) {
      payment = new Payment({
        user: req.user._id,
        plan: plan._id,
        orderId,
        amount,
        currency: plan.currency || 'INR',
        billingCycle,
      });
    }

    payment.paymentId = paymentId;
    payment.signature = signature;
    payment.status = 'Successful';
    payment.subscription = subscription._id;
    await payment.save();

    // Create Invoice record
    const invoice = await createInvoiceRecord({
      user: req.user,
      subscription,
      payment,
      plan,
      billingCycle,
      amount,
    });

    payment.invoiceNumber = invoice.invoiceNumber;
    payment.invoice = invoice._id;
    await payment.save();

    // Reset user quotas to fresh plan entitlement
    await User.findByIdAndUpdate(req.user._id, {
      'usageQuota.dailyDownloadsUsed': 0,
      'usageQuota.lastQuotaResetDate': new Date(),
    });

    // In-app notification
    await createNotification({
      userId: req.user._id,
      title: `Subscribed to ${plan.name} Plan!`,
      message: `Your payment of ₹${amount} was verified successfully. Enjoy ${plan.name} benefits!`,
      type: 'subscription',
      link: '/dashboard',
    });

    // Audit log
    await logActivity({
      userId: req.user._id,
      action: 'SUBSCRIBE',
      details: `Subscribed to ${plan.name} (${billingCycle}) via Razorpay. Order: ${orderId}, Payment: ${paymentId}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: `Successfully subscribed to ${plan.name} plan!`,
      subscription,
      payment,
      invoice,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Record failed or cancelled Razorpay checkout attempt
// @route   POST /api/payments/failure
// @access  Private
export const handlePaymentFailure = async (req, res, next) => {
  try {
    const { orderId, paymentId, reason = 'Payment cancelled or declined by user' } = req.body;

    if (orderId) {
      await Payment.findOneAndUpdate(
        { orderId },
        { status: 'Failed', failureReason: reason, paymentId: paymentId || undefined }
      );
    }

    await logActivity({
      userId: req.user._id,
      action: 'PAYMENT_FAILED',
      details: `Payment cancelled or failed. Order: ${orderId || 'N/A'}, Reason: ${reason}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: 'Payment failure recorded.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user payments
// @route   GET /api/payments/my-payments
// @access  Private
export const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate('plan', 'name tierLevel')
      .populate('invoice', 'invoiceNumber total')
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

// @desc    Free plan activation (no payment required)
// @route   POST /api/payments/activate-free
// @access  Private
export const activateFreePlan = async (req, res, next) => {
  try {
    const freePlan = await SubscriptionPlan.findOne({ slug: 'free' });
    if (!freePlan) {
      return res.status(404).json({ success: false, message: 'Free plan not found.' });
    }

    await Subscription.updateMany(
      { user: req.user._id, status: 'Active' },
      { status: 'Expired' }
    );

    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 5);

    const subscription = await Subscription.create({
      user: req.user._id,
      plan: freePlan._id,
      billingCycle: 'yearly',
      status: 'Active',
      startDate: new Date(),
      endDate,
      amount: 0,
      autoRenew: false,
    });

    await createNotification({
      userId: req.user._id,
      title: 'Switched to Free Plan',
      message: 'You have switched to the base Free membership plan.',
      type: 'subscription',
      link: '/dashboard',
    });

    res.status(200).json({
      success: true,
      message: 'Switched to Free Plan successfully.',
      subscription,
    });
  } catch (err) {
    next(err);
  }
};
