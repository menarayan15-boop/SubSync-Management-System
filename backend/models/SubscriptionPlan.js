import mongoose from 'mongoose';

const SubscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    tagline: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    tierLevel: {
      type: Number,
      required: true,
      default: 0, // 0: Free, 1: Bronze, 2: Silver, 3: Gold
    },
    badge: {
      type: String,
      default: '',
    },
    monthlyPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    quarterlyPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    yearlyPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    quotas: {
      dailyDownloads: { type: Number, default: 1 }, // Free: 1, Bronze: 3, Silver: 5, Gold: 10
      monthlyDownloads: { type: Number, default: 30 },
      streamingQuality: { type: String, default: '480p' }, // 480p, 720p, 1080p, 4K
      watchTimeLimit: { type: String, default: 'Limited' }, // Limited, Increased, Extensive, Unlimited
      adFree: { type: Boolean, default: false },
      maxDevices: { type: Number, default: 1 },
      prioritySupport: { type: Boolean, default: false },
      analyticsAccess: { type: Boolean, default: false },
    },
    features: [
      {
        name: { type: String, required: true },
        included: { type: Boolean, default: true },
      },
    ],
    isRecommended: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);
