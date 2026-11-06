import UserReward from '../models/UserReward.js';
import RewardTransaction from '../models/RewardTransaction.js';
import RewardCatalogueItem from '../models/RewardCatalogueItem.js';
import RewardRedemption from '../models/RewardRedemption.js';
import User from '../models/User.js';
import {
  getOrCreateUserReward,
  awardRewardPoints,
  redeemItem,
} from '../services/rewardService.js';
import { logActivity } from '../services/activityService.js';

// @desc    Get user's rewards dashboard and catalogue
// @route   GET /api/rewards/dashboard
// @access  Private
export const getRewardsDashboard = async (req, res, next) => {
  try {
    const profile = await getOrCreateUserReward(req.user._id);

    const [catalogueItems, recentTransactions, activeRedemptions] = await Promise.all([
      RewardCatalogueItem.find({ isActive: true }).sort({ pointCost: 1 }),
      RewardTransaction.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10),
      RewardRedemption.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('catalogueItem'),
    ]);

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const referralLink = `${clientUrl}/register?ref=${profile.reward.referralCode}`;

    res.status(200).json({
      success: true,
      profile: {
        availablePoints: profile.reward.availablePoints,
        lifetimeEarned: profile.reward.lifetimeEarned,
        pointsSpent: profile.reward.pointsSpent,
        currentLevel: profile.reward.currentLevel,
        nextLevel: profile.nextLevel,
        pointsToNextLevel: profile.pointsToNextLevel,
        progressPercent: profile.progressPercent,
        referralCode: profile.reward.referralCode,
        referralCount: profile.reward.referralCount,
        referralLink,
      },
      catalogue: catalogueItems,
      recentTransactions,
      redemptions: activeRedemptions,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Redeem a catalogue item
// @route   POST /api/rewards/redeem
// @access  Private
export const redeemReward = async (req, res, next) => {
  try {
    const { itemId } = req.body;
    if (!itemId) {
      return res.status(400).json({ success: false, message: 'Item ID is required.' });
    }

    const result = await redeemItem(req.user._id, itemId);

    await logActivity({
      userId: req.user._id,
      action: 'REWARD_REDEEMED',
      details: `Redeemed ${result.item.title} for ${result.item.pointCost} points. Code: ${result.redemption.redemptionCode}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: `Successfully redeemed "${result.item.title}"!`,
      redemption: result.redemption,
      remainingPoints: result.reward.availablePoints,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Redemption failed.',
    });
  }
};

// @desc    Get paginated transaction ledger
// @route   GET /api/rewards/transactions
// @access  Private
export const getTransactions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      RewardTransaction.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      RewardTransaction.countDocuments({ user: req.user._id }),
    ]);

    res.status(200).json({
      success: true,
      transactions,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Manually adjust user points with audit reason
// @route   POST /api/rewards/admin/adjust
// @access  Private/Admin
export const adminAdjustPoints = async (req, res, next) => {
  try {
    const { userId, points, reason } = req.body;

    if (!userId || points === undefined || !reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'User ID, points delta, and a mandatory audit reason are required.',
      });
    }

    const numPoints = Number(points);
    if (isNaN(numPoints) || numPoints === 0) {
      return res.status(400).json({ success: false, message: 'Invalid point amount.' });
    }

    const userReward = await UserReward.findOne({ user: userId });
    if (!userReward) {
      return res.status(404).json({ success: false, message: 'User reward record not found.' });
    }

    if (numPoints < 0 && userReward.availablePoints + numPoints < 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot deduct ${Math.abs(numPoints)} points: user only has ${userReward.availablePoints} points.`,
      });
    }

    userReward.availablePoints += numPoints;
    if (numPoints > 0) userReward.lifetimeEarned += numPoints;
    await userReward.save();

    const reference = `TXN-REW-${Date.now().toString().slice(-6)}-ADJ`;
    const transaction = await RewardTransaction.create({
      user: userId,
      type: 'admin_adjustment',
      action: 'ADMIN_MANUAL_ADJUSTMENT',
      points: Math.abs(numPoints),
      balanceAfter: userReward.availablePoints,
      reference,
      description: `Admin adjustment (${numPoints > 0 ? '+' : ''}${numPoints}): ${reason.trim()}`,
      metadata: { adjustedBy: req.user._id, reason },
    });

    res.status(200).json({
      success: true,
      message: `Adjusted points by ${numPoints > 0 ? '+' : ''}${numPoints} successfully.`,
      newBalance: userReward.availablePoints,
      transaction,
    });
  } catch (err) {
    next(err);
  }
};

