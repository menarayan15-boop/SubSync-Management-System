import mongoose from 'mongoose';

const trackedSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Subscription name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    provider: {
      type: String,
      trim: true,
      default: '',
    },
    amount: {
      type: Number,
      required: [true, 'Subscription amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly', 'weekly', 'one-time'],
      default: 'monthly',
    },
    category: {
      type: String,
      enum: [
        'Entertainment',
        'Productivity',
        'Cloud & Dev',
        'Education',
        'Health & Fitness',
        'Business',
        'Utilities',
        'Other',
      ],
      default: 'Other',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    nextRenewalDate: {
      type: Date,
      index: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Cancelled', 'Paused', 'Trial'],
      default: 'Active',
    },
    cancellationUrl: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    sourceDocument: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ScannedDocument',
    },
    cancellationWorkflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CancellationWorkflow',
    },
  },
  {
    timestamps: true,
  }
);

trackedSubscriptionSchema.index({ user: 1, name: 1 });
trackedSubscriptionSchema.index({ user: 1, nextRenewalDate: 1 });

const TrackedSubscription = mongoose.model('TrackedSubscription', trackedSubscriptionSchema);

export default TrackedSubscription;

