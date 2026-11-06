import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';

/**
 * Generate a cryptographically signed verification token for membership cards
 */
const generateCardToken = (user, planName, status, expiryDate) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      memberId: user.memberId,
      tier: planName,
      status,
      expDate: expiryDate ? new Date(expiryDate).getTime() : null,
      iat: Math.floor(Date.now() / 1000),
    },
    process.env.JWT_SECRET || 'subsync_jwt_secret_production_fallback',
    { expiresIn: '30d' }
  );
};

// @desc    Get current user's digital membership card data
// @route   GET /api/membership/card
// @access  Private
export const getMembershipCard = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.memberId) {
      user.memberId = `SS-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await user.save();
    }

    // Fetch active subscription
    const subscription = await Subscription.findOne({
      user: user._id,
      status: 'Active',
    }).populate('plan');

    // Default to Free plan if none active or expired
    let planName = 'Free';
    let tierLevel = 0;
    let perks = ['1 Daily Download', 'SD 480p Quality', 'Basic Technical Guides'];
    let status = 'Active';
    let startDate = user.createdAt;
    let expiryDate = null;
    let daysRemaining = null;

    if (subscription && subscription.plan) {
      const now = new Date();
      if (subscription.endDate && new Date(subscription.endDate) < now) {
        status = 'Expired';
        planName = 'Free';
        tierLevel = 0;
      } else {
        planName = subscription.plan.name;
        tierLevel = subscription.plan.tierLevel;
        perks = subscription.plan.features?.map((f) => f.name) || perks;
        status = subscription.status;
        startDate = subscription.startDate || user.createdAt;
        expiryDate = subscription.endDate;
        if (expiryDate) {
          daysRemaining = Math.max(0, Math.ceil((new Date(expiryDate) - now) / (1000 * 60 * 60 * 24)));
        }
      }
    }

    const verificationToken = generateCardToken(user, planName, status, expiryDate);
    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const verificationUrl = `${clientBaseUrl}/verify-membership?token=${verificationToken}`;

    res.status(200).json({
      success: true,
      card: {
        memberId: user.memberId,
        userId: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        tier: planName,
        tierLevel,
        status,
        startDate,
        expiryDate,
        daysRemaining,
        perks,
        token: verificationToken,
        verificationToken,
        verificationUrl,
        issuedAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Public QR verification endpoint
// @route   GET /api/membership/verify/:token?
// @access  Public
export const verifyMembershipToken = async (req, res, next) => {
  try {
    const token = req.params.token || req.query.token;

    if (!token) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: 'No verification token provided in request.',
      });
    }

    // 1. Cryptographically decode token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'subsync_jwt_secret_production_fallback');
    } catch (err) {
      return res.status(401).json({
        success: false,
        verified: false,
        message: 'Cryptographic signature is invalid or has expired.',
      });
    }

    // 2. Query MongoDB for real-time validation (Never trust token alone!)
    const user = await User.findById(decoded.sub);
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: 'Member record does not exist or account is inactive.',
      });
    }

    // 3. Inspect real-time subscription status from database
    const subscription = await Subscription.findOne({
      user: user._id,
      status: 'Active',
    }).populate('plan');

    let currentTier = 'Free';
    let tierLevel = 0;
    let isExpired = false;
    let actualStatus = 'Active';
    let expiryDate = null;

    if (subscription && subscription.plan) {
      const now = new Date();
      if (subscription.endDate && new Date(subscription.endDate) < now) {
        isExpired = true;
        actualStatus = 'Expired';
        currentTier = 'Free';
        tierLevel = 0;
      } else {
        currentTier = subscription.plan.name;
        tierLevel = subscription.plan.tierLevel;
        actualStatus = subscription.status;
        expiryDate = subscription.endDate;
      }
    }

    res.status(200).json({
      success: true,
      verified: true,
      member: {
        memberId: user.memberId || decoded.memberId,
        name: user.name,
        tier: currentTier,
        tierLevel,
        status: actualStatus,
        isGenuine: true,
        startDate: subscription?.startDate || user.createdAt,
        expiryDate,
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
};
