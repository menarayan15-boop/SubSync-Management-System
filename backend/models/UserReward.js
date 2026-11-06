import mongoose from 'mongoose';
import crypto from 'crypto';

const userRewardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    availablePoints: {
      type: Number,
      default: 50, // 50 Welcome Bonus points
      min: [0, 'Points balance cannot be negative'],
    },
    lifetimeEarned: {
      type: Number,
      default: 50,
      min: 0,
    },
    pointsSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentLevel: {
      type: String,
      enum: ['Starter', 'Explorer', 'Achiever', 'Pro Member', 'Elite Member'],
      default: 'Starter',
    },
    referralCode: {
      type: String,
      unique: true,
      index: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    referralCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate referral code if missing
userRewardSchema.pre('save', function (next) {
  if (!this.referralCode) {
    this.referralCode = `REF-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  // Recalculate level based on lifetime earned points
  const points = this.lifetimeEarned || 0;
  if (points >= 1000) this.currentLevel = 'Elite Member';
  else if (points >= 600) this.currentLevel = 'Pro Member';
  else if (points >= 300) this.currentLevel = 'Achiever';
  else if (points >= 100) this.currentLevel = 'Explorer';
  else this.currentLevel = 'Starter';

  next();
});

const UserReward = mongoose.model('UserReward', userRewardSchema);

export default UserReward;

