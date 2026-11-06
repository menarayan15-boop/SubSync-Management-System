import mongoose from 'mongoose';

const discoveryServiceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Education and Learning',
        'Artificial Intelligence Tools',
        'Productivity',
        'Entertainment',
        'Cloud Storage',
        'Developer Tools',
        'Design and Creativity',
        'Business and Finance',
        'Fitness and Wellness',
      ],
      index: true,
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    fullDescription: {
      type: String,
      default: '',
    },
    plans: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        currency: { type: String, default: 'INR' },
        billingFrequency: {
          type: String,
          enum: ['monthly', 'yearly', 'free', 'one-time'],
          default: 'monthly',
        },
        hasFreeTrial: { type: Boolean, default: false },
        freeTrialDays: { type: Number, default: 0 },
        features: [String],
        limitations: [String],
      },
    ],
    supportedPlatforms: {
      type: [String],
      default: ['Web', 'iOS', 'Android'],
    },
    officialWebsite: {
      type: String,
      required: [true, 'Official website URL is required'],
    },
    lastVerifiedDate: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    popularityScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    alternatives: [
      {
        serviceName: { type: String, required: true },
        reason: { type: String, required: true },
        link: { type: String, default: '' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

discoveryServiceSchema.index({ category: 1, popularityScore: -1 });

const DiscoveryService = mongoose.model('DiscoveryService', discoveryServiceSchema);

export default DiscoveryService;

