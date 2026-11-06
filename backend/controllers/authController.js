import crypto from 'crypto';
import User from '../models/User.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import Subscription from '../models/Subscription.js';
import { logActivity } from '../services/activityService.js';
import { createNotification } from '../services/notificationService.js';
import { checkAndExpireSubscription } from './subscriptionController.js';
import { applyReferralCode, getOrCreateUserReward } from '../services/rewardService.js';

// Helper to send token response
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      id: user._id,
      _id: user._id,
      memberId: user.memberId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
      notificationPreferences: user.notificationPreferences,
      usageQuota: user.usageQuota,
      createdAt: user.createdAt,
    },
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    if (!name || !name.trim() || !email || !email.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Please provide full name, email, and password.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Create user with normalized email
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : '',
      password,
      role: 'user',
    });

    // Automatically enroll in default Free Plan
    const freePlan = await SubscriptionPlan.findOne({ slug: 'free' });
    if (freePlan) {
      const oneYearLater = new Date();
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 10); // Free plan perpetual

      await Subscription.create({
        user: user._id,
        plan: freePlan._id,
        billingCycle: 'yearly',
        status: 'Active',
        startDate: new Date(),
        endDate: oneYearLater,
        amount: 0,
      });
    }

    // Log registration activity
    await logActivity({
      userId: user._id,
      action: 'REGISTER',
      details: 'User registered account and activated Free Plan',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Send welcome notification
    await createNotification({
      userId: user._id,
      title: 'Welcome to SubSync!',
      message: 'Your account has been created. You are currently on the Free Plan with initial daily download quotas.',
      type: 'subscription',
      link: '/dashboard',
    });

    // Initialize rewards profile with 50 Welcome Bonus points
    await getOrCreateUserReward(user._id);

    // Apply referral code if provided
    if (req.body.referralCode) {
      try {
        await applyReferralCode(user._id, req.body.referralCode);
      } catch (refErr) {
        console.warn('Referral application warning:', refErr.message);
      }
    }

    sendTokenResponse(user, 201, res, 'Registration successful! Welcome to SubSync.');
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Find user & include password field
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account is currently disabled. Please contact support.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Log login activity
    await logActivity({
      userId: user._id,
      action: 'LOGIN',
      details: 'User logged in successfully',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    sendTokenResponse(user, 200, res, 'Logged in successfully.');
  } catch (err) {
    next(err);
  }
};

// @desc    Get currently authenticated user & subscription info
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    // Fetch active subscription and verify auto-expiry
    let subscription = await Subscription.findOne({
      user: user._id,
      status: 'Active',
    })
      .populate('plan')
      .populate('scheduledDowngradePlan')
      .sort({ createdAt: -1 });

    if (subscription) {
      subscription = await checkAndExpireSubscription(user, subscription);
    }

    res.status(200).json({
      success: true,
      user,
      subscription: subscription || null,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile details
// @route   PUT /api/auth/update-profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar, notificationPreferences } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (phone !== undefined) fieldsToUpdate.phone = phone;
    if (avatar !== undefined) fieldsToUpdate.avatar = avatar;
    if (notificationPreferences) fieldsToUpdate.notificationPreferences = notificationPreferences;

    const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    await logActivity({
      userId: user._id,
      action: 'PROFILE_UPDATE',
      details: 'User updated profile information',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please enter both current and new password.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    await logActivity({
      userId: user._id,
      action: 'PASSWORD_CHANGE',
      details: 'User updated their account password',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    sendTokenResponse(user, 200, res, 'Password updated successfully.');
  } catch (err) {
    next(err);
  }
};

// @desc    Forgot password request
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a reset token has been generated.',
      });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Password reset link simulated. Use reset token to change password.',
      resetToken, // for testing / development ease
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset password with token
// @route   PUT /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, 'Password reset successful. You are now logged in.');
  } catch (err) {
    next(err);
  }
};

// @desc    Delete account
// @route   DELETE /api/auth/account
// @access  Private
export const deleteAccount = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    await Subscription.deleteMany({ user: req.user._id });

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};
