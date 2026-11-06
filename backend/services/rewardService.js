import crypto from 'crypto';
import UserReward from '../models/UserReward.js';
import RewardTransaction from '../models/RewardTransaction.js';
import RewardCatalogueItem from '../models/RewardCatalogueItem.js';
import RewardRedemption from '../models/RewardRedemption.js';
import User from '../models/User.js';

export const LEVEL_CONFIG = {
  Starter: { min: 0, next: 'Explorer', nextMin: 100 },
  Explorer: { min: 100, next: 'Achiever', nextMin: 300 },
  Achiever: { min: 300, next: 'Pro Member', nextMin: 600 },
  'Pro Member': { min: 600, next: 'Elite Member', nextMin: 1000 },
  'Elite Member': { min: 1000, next: null, nextMin: 1000 },
};

/**
 * Ensures user has an initialized reward profile and returns level metrics
 */
export const getOrCreateUserReward = async (userId) => {
  let reward = await UserReward.findOne({ user: userId });

  if (!reward) {
    const refCode = `REF-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    reward = await UserReward.create({
      user: userId,
      availablePoints: 50,
      lifetimeEarned: 50,
      pointsSpent: 0,
      currentLevel: 'Starter',
      referralCode: refCode,
    });

    // Record welcome bonus transaction
    await RewardTransaction.create({
      user: userId,
      type: 'earn',
      action: 'WELCOME_BONUS',
      points: 50,
      balanceAfter: 50,
      reference: `TXN-REW-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
      description: 'Welcome bonus for joining SubSync!',
    });
  }

  const levelInfo = LEVEL_CONFIG[reward.currentLevel] || LEVEL_CONFIG.Starter;
  let pointsToNext = 0;
  let progressPercent = 100;

  if (levelInfo.next) {
    const range = levelInfo.nextMin - levelInfo.min;
    const currentProgress = (reward.lifetimeEarned || 0) - levelInfo.min;
    pointsToNext = Math.max(0, levelInfo.nextMin - (reward.lifetimeEarned || 0));
    progressPercent = Math.min(100, Math.max(0, Math.round((currentProgress / range) * 100)));
  }

  return {
    reward,
    nextLevel: levelInfo.next,
    pointsToNext,
    progressPercent,
  };
};

/**
 * Atomically awards reward points and logs ledger transaction
 */
export const awardRewardPoints = async (userId, action, points, description, metadata = {}) => {
  if (points <= 0) return null;

  const reward = await UserReward.findOneAndUpdate(
    { user: userId },
    {
      $inc: {
        availablePoints: points,
        lifetimeEarned: points,
      },
    },
    { new: true, upsert: true }
  );

  // Re-save to trigger level recalculation pre-save hook
  await reward.save();

  const reference = `TXN-REW-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  const transaction = await RewardTransaction.create({
    user: userId,
    type: 'earn',
    action,
    points,
    balanceAfter: reward.availablePoints,
    reference,
    description: description || `Earned ${points} points for ${action}`,
    metadata,
  });

  return { reward, transaction };
};

/**
 * Atomically redeems a catalogue item with balance checks
 */
export const redeemItem = async (userId, itemId) => {
  const item = await RewardCatalogueItem.findById(itemId);
  if (!item || !item.isActive) {
    throw new Error('Reward item is unavailable or out of stock.');
  }

  // Atomic deduction: ensure availablePoints >= item.pointCost
  const reward = await UserReward.findOneAndUpdate(
    {
      user: userId,
      availablePoints: { $gte: item.pointCost },
    },
    {
      $inc: {
        availablePoints: -item.pointCost,
        pointsSpent: item.pointCost,
      },
    },
    { new: true }
  );

  if (!reward) {
    throw new Error(`Insufficient points balance. You need ${item.pointCost} points to redeem this item.`);
  }

  await reward.save();

  const redemptionCode = `REDEEM-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString().slice(-4)}`;

  const redemption = await RewardRedemption.create({
    user: userId,
    catalogueItem: item._id,
    pointCost: item.pointCost,
    redemptionCode,
    status: 'active',
    benefitDetails: item.benefitPayload,
  });

  // Log spend transaction
  const reference = `TXN-REW-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  await RewardTransaction.create({
    user: userId,
    type: 'spend',
    action: 'REWARD_REDEEMED',
    points: item.pointCost,
    balanceAfter: reward.availablePoints,
    reference,
    description: `Redeemed "${item.title}" (${redemptionCode})`,
    metadata: { itemId: item._id, redemptionCode },
  });

  // If benefit is immediate quota boost, fulfill immediately
  if (item.category === 'downloads' && item.benefitPayload?.quotaBonus) {
    await User.findByIdAndUpdate(userId, {
      $inc: { 'usageQuota.dailyLimit': item.benefitPayload.quotaBonus },
    });
  }

  return { redemption, reward, item };
};

/**
 * Processes a valid referral code when a user signs up
 */
export const applyReferralCode = async (newUserId, referralCode) => {
  if (!referralCode || !referralCode.trim()) return null;

  const cleanCode = referralCode.trim().toUpperCase();
  const referrerReward = await UserReward.findOne({ referralCode: cleanCode });

  if (!referrerReward) return null;

  // Prevent self-referral
  if (referrerReward.user.toString() === newUserId.toString()) return null;

  // Set referredBy on new user
  await UserReward.findOneAndUpdate(
    { user: newUserId },
    { referredBy: referrerReward.user },
    { upsert: true }
  );

  // Award referrer 100 points
  await awardRewardPoints(
    referrerReward.user,
    'FRIEND_REFERRED',
    100,
    'Earned 100 points: A friend joined SubSync using your referral code!',
    { referredUserId: newUserId }
  );

  // Increment referral count
  await UserReward.findByIdAndUpdate(referrerReward._id, { $inc: { referralCount: 1 } });

  return referrerReward;
};

