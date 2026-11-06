import mongoose from 'mongoose';

const rewardCatalogueItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    pointCost: {
      type: Number,
      required: true,
      min: [1, 'Point cost must be at least 1'],
    },
    category: {
      type: String,
      enum: ['downloads', 'premium_pass', 'discount_coupon', 'upgrade'],
      default: 'downloads',
    },
    icon: {
      type: String,
      default: 'gift',
    },
    benefitPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    stock: {
      type: Number,
      default: 999,
    },
  },
  {
    timestamps: true,
  }
);

const RewardCatalogueItem = mongoose.model('RewardCatalogueItem', rewardCatalogueItemSchema);

export default RewardCatalogueItem;

