import mongoose from 'mongoose';

const WebhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    event: {
      type: String,
      required: true,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['Processed', 'Failed', 'Ignored', 'Duplicate'],
      default: 'Processed',
    },
    signature: {
      type: String,
      default: '',
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('WebhookEvent', WebhookEventSchema);
