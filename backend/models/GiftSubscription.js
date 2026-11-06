import mongoose from 'mongoose';
import crypto from 'crypto';

const GiftSubscriptionSchema = new mongoose.Schema(
  {
    purchaser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    durationMonths: {
      type: Number,
      enum: [1, 3, 6, 12],
      default: 1,
    },
    recipientEmail: {
      type: String,
      required: [true, 'Recipient email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid recipient email address',
      ],
      index: true,
    },
    recipientName: {
      type: String,
      required: [true, 'Recipient name is required'],
      trim: true,
    },
    senderName: {
      type: String,
      required: [true, 'Sender name is required'],
      trim: true,
    },
    personalMessage: {
      type: String,
      maxlength: [500, 'Personal message cannot exceed 500 characters'],
      default: '',
    },
    redemptionCode: {
      type: String,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    razorpayOrderId: {
      type: String,
      required: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: '',
    },
    razorpaySignature: {
      type: String,
      default: '',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
      index: true,
    },
    redemptionStatus: {
      type: String,
      enum: ['Unredeemed', 'Redeemed', 'Expired', 'Cancelled'],
      default: 'Unredeemed',
      index: true,
    },
    redeemedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    redeemedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    activatedSubscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
    },
  },
  { timestamps: true }
);

// Pre-save hook to generate cryptographically secure redemption code
GiftSubscriptionSchema.pre('save', function (next) {
  if (!this.redemptionCode) {
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.redemptionCode = `GIFT-${randomHex}-${randomNum}`;
  }
  next();
});

export default mongoose.model('GiftSubscription', GiftSubscriptionSchema);

