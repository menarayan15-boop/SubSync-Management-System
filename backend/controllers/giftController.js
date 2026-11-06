import crypto from 'crypto';
import GiftSubscription from '../models/GiftSubscription.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  getRazorpayKeyId,
} from '../services/razorpayService.js';
import { logActivity } from '../services/activityService.js';

// @desc    Initiate Razorpay order for purchasing a gift subscription
// @route   POST /api/gifts/create-order
// @access  Private
export const createGiftOrder = async (req, res, next) => {
  try {
    const {
      planId,
      durationMonths = 1,
      recipientEmail,
      recipientName,
      personalMessage = '',
    } = req.body;

    if (!planId || !recipientEmail || !recipientName) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID, recipient email, and recipient name are required.',
      });
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found.' });
    }

    if (plan.monthlyPrice === 0) {
      return res.status(400).json({
        success: false,
        message: 'The Free tier cannot be gifted. Please select a Bronze, Silver, or Gold tier.',
      });
    }

    const months = [1, 3, 6, 12].includes(Number(durationMonths)) ? Number(durationMonths) : 1;
    let baseAmount = plan.monthlyPrice * months;

    // Apply bundle incentives for 3, 6, 12 months
    if (months === 3) baseAmount = plan.quarterlyPrice || Math.round(baseAmount * 0.95);
    if (months === 6) baseAmount = Math.round(baseAmount * 0.9);
    if (months === 12) baseAmount = plan.yearlyPrice || Math.round(baseAmount * 0.85);

    const orderData = await createRazorpayOrder({
      amount: baseAmount,
      currency: plan.currency || 'INR',
      receipt: `gift_${Date.now().toString().slice(-8)}`,
    });

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 6); // Gift codes valid for 6 months

    const gift = await GiftSubscription.create({
      purchaser: req.user._id,
      plan: plan._id,
      durationMonths: months,
      recipientEmail: recipientEmail.toLowerCase().trim(),
      recipientName: recipientName.trim(),
      senderName: req.user.name || 'A SubSync Friend',
      personalMessage: personalMessage.slice(0, 500),
      amount: baseAmount,
      currency: plan.currency || 'INR',
      razorpayOrderId: orderData.id,
      paymentStatus: 'Pending',
      redemptionStatus: 'Unredeemed',
      expiresAt,
    });

    res.status(200).json({
      success: true,
      orderId: orderData.id,
      amount: orderData.amount, // in paise
      actualAmount: baseAmount,
      currency: orderData.currency,
      keyId: orderData.keyId || getRazorpayKeyId(),
      planName: plan.name,
      durationMonths: months,
      giftId: gift._id,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify Razorpay payment signature & activate gift code
// @route   POST /api/gifts/verify-payment
// @access  Private
export const verifyGiftPayment = async (req, res, next) => {
  try {
    const { orderId, paymentId, signature, giftId } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Order ID, Payment ID, and Signature are required.',
      });
    }

    const isValid = verifyRazorpaySignature({ orderId, paymentId, signature });
    if (!isValid) {
      await GiftSubscription.findOneAndUpdate(
        { razorpayOrderId: orderId },
        { paymentStatus: 'Failed' }
      );
      return res.status(400).json({
        success: false,
        message: 'Invalid cryptographic payment signature.',
      });
    }

    const gift = await GiftSubscription.findOne({ razorpayOrderId: orderId }).populate('plan');
    if (!gift) {
      return res.status(404).json({ success: false, message: 'Gift record not found.' });
    }

    gift.paymentStatus = 'Paid';
    gift.razorpayPaymentId = paymentId;
    gift.razorpaySignature = signature;
    await gift.save();

    // Notify purchaser
    await Notification.create({
      user: req.user._id,
      title: 'Gift Subscription Purchased! 🎁',
      message: `Your gift of ${gift.plan?.name} Plan (${gift.durationMonths} month(s)) for ${gift.recipientName} is ready. Redemption code: ${gift.redemptionCode}`,
      category: 'payment_success',
      actionUrl: '/gift',
    });

    // Notify recipient if they already have an account
    const recipientUser = await User.findOne({ email: gift.recipientEmail });
    if (recipientUser) {
      await Notification.create({
        user: recipientUser._id,
        title: 'You Received a Gift Subscription! 🎁',
        message: `${gift.senderName} sent you a ${gift.plan?.name} Plan gift subscription! Use code ${gift.redemptionCode} to redeem your membership.`,
        category: 'new_resource',
        actionUrl: `/redeem-gift?code=${gift.redemptionCode}`,
      });
    }

    await logActivity({
      userId: req.user._id,
      action: 'GIFT_PURCHASED',
      details: `Purchased gift subscription code ${gift.redemptionCode} for ${gift.recipientEmail} (${gift.plan?.name} Plan).`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: 'Gift subscription successfully purchased!',
      gift: {
        redemptionCode: gift.redemptionCode,
        planName: gift.plan?.name,
        durationMonths: gift.durationMonths,
        recipientName: gift.recipientName,
        recipientEmail: gift.recipientEmail,
        expiresAt: gift.expiresAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's purchased gifts
// @route   GET /api/gifts/my-gifts
// @access  Private
export const getMyPurchasedGifts = async (req, res, next) => {
  try {
    const gifts = await GiftSubscription.find({
      purchaser: req.user._id,
      paymentStatus: 'Paid',
    })
      .populate('plan', 'name slug monthlyPrice tierLevel')
      .populate('redeemedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: gifts.length,
      gifts,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Preview gift code before redemption
// @route   GET /api/gifts/preview/:code
// @access  Public
export const previewGiftCode = async (req, res, next) => {
  try {
    const code = (req.params.code || '').trim().toUpperCase();

    const gift = await GiftSubscription.findOne({ redemptionCode: code })
      .populate('plan', 'name slug monthlyPrice tierLevel quotas features')
      .populate('purchaser', 'name');

    if (!gift) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Invalid redemption code. Please verify the code and try again.',
      });
    }

    if (gift.paymentStatus !== 'Paid') {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'This gift subscription payment was not finalized.',
      });
    }

    if (gift.redemptionStatus === 'Redeemed') {
      return res.status(400).json({
        success: false,
        valid: false,
        message: `This gift subscription has already been redeemed on ${new Date(gift.redeemedAt).toLocaleDateString()}.`,
      });
    }

    if (new Date() > new Date(gift.expiresAt)) {
      gift.redemptionStatus = 'Expired';
      await gift.save();
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'This gift code has expired.',
      });
    }

    res.status(200).json({
      success: true,
      valid: true,
      gift: {
        code: gift.redemptionCode,
        planName: gift.plan?.name,
        planSlug: gift.plan?.slug,
        tierLevel: gift.plan?.tierLevel,
        durationMonths: gift.durationMonths,
        senderName: gift.senderName,
        recipientName: gift.recipientName,
        personalMessage: gift.personalMessage,
        expiresAt: gift.expiresAt,
        quotas: gift.plan?.quotas,
        features: gift.plan?.features?.filter((f) => f.included).map((f) => f.name),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Redeem gift code & activate subscription
// @route   POST /api/gifts/redeem
// @access  Private
export const redeemGiftCode = async (req, res, next) => {
  try {
    const { redemptionCode } = req.body;
    const code = (redemptionCode || '').trim().toUpperCase();

    if (!code) {
      return res.status(400).json({ success: false, message: 'Redemption code is required.' });
    }

    // Atomic find to prevent race conditions & double redemption
    const gift = await GiftSubscription.findOne({
      redemptionCode: code,
      paymentStatus: 'Paid',
      redemptionStatus: 'Unredeemed',
    }).populate('plan');

    if (!gift) {
      return res.status(400).json({
        success: false,
        message: 'Gift code is invalid, already redeemed, or payment is unverified.',
      });
    }

    if (new Date() > new Date(gift.expiresAt)) {
      gift.redemptionStatus = 'Expired';
      await gift.save();
      return res.status(400).json({ success: false, message: 'This gift code has expired.' });
    }

    const durationDays = gift.durationMonths * 30;
    const now = new Date();

    // Check user's current subscription
    let subscription = await Subscription.findOne({
      user: req.user._id,
      status: 'Active',
    });

    let newStartDate = now;
    let newEndDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    if (subscription) {
      // If user has existing active subscription with same plan, extend it
      if (subscription.plan.toString() === gift.plan._id.toString() && subscription.endDate > now) {
        newStartDate = subscription.startDate;
        newEndDate = new Date(new Date(subscription.endDate).getTime() + durationDays * 24 * 60 * 60 * 1000);
      }
      subscription.plan = gift.plan._id;
      subscription.startDate = newStartDate;
      subscription.endDate = newEndDate;
      subscription.nextBillingDate = newEndDate;
      subscription.status = 'Active';
      subscription.amount = gift.amount;
      await subscription.save();
    } else {
      subscription = await Subscription.create({
        user: req.user._id,
        plan: gift.plan._id,
        billingCycle: gift.durationMonths === 1 ? 'monthly' : 'quarterly',
        status: 'Active',
        startDate: newStartDate,
        endDate: newEndDate,
        nextBillingDate: newEndDate,
        amount: gift.amount,
        currency: gift.currency,
        paymentMethod: 'Gift Redemption',
      });
    }

    // Mark gift redeemed
    gift.redemptionStatus = 'Redeemed';
    gift.redeemedBy = req.user._id;
    gift.redeemedAt = new Date();
    gift.activatedSubscription = subscription._id;
    await gift.save();

    // Reset daily quota to allow instant fresh downloads
    await User.findByIdAndUpdate(req.user._id, {
      'usageQuota.dailyDownloadsUsed': 0,
      'usageQuota.lastQuotaResetDate': now,
    });

    // Create Notification
    await Notification.create({
      user: req.user._id,
      title: 'Gift Membership Activated! 🌟',
      message: `You successfully redeemed a ${gift.plan?.name} membership valid until ${newEndDate.toLocaleDateString()}. Enjoy premium access!`,
      category: 'upgrade',
      actionUrl: '/dashboard',
    });

    await logActivity({
      userId: req.user._id,
      action: 'GIFT_REDEEMED',
      details: `Redeemed gift subscription code ${gift.redemptionCode} for ${gift.plan?.name} Plan.`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: `Congratulations! Your ${gift.plan?.name} membership has been activated until ${newEndDate.toLocaleDateString()}.`,
      subscription: {
        planName: gift.plan?.name,
        startDate: newStartDate,
        endDate: newEndDate,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: get all gifts
// @route   GET /api/gifts/admin/all
// @access  Private/Admin
export const getAllGiftsAdmin = async (req, res, next) => {
  try {
    const gifts = await GiftSubscription.find()
      .populate('purchaser', 'name email')
      .populate('redeemedBy', 'name email')
      .populate('plan', 'name monthlyPrice')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: gifts.length,
      gifts,
    });
  } catch (err) {
    next(err);
  }
};

