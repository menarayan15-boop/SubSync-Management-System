import mongoose from 'mongoose';

const rewardRedemptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    catalogueItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RewardCatalogueItem',
      required: true,
    },
    pointCost: {
      type: Number,
      required: true,
    },
    redemptionCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['active', 'used', 'expired'],
      default: 'active',
      index: true,
    },
    benefitDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

rewardRedemptionSchema.index({ user: 1, createdAt: -1 });

const RewardRedemption = mongoose.model('RewardRedemption', rewardRedemptionSchema);

export default RewardRedemption;

