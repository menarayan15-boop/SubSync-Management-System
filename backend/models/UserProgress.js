import mongoose from 'mongoose';

const UserProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['started', 'completed'],
      default: 'completed',
      index: true,
    },
    category: {
      type: String,
      default: 'General',
      index: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Compound index to ensure 1 completion record per user + resource
UserProgressSchema.index({ user: 1, resource: 1 }, { unique: true });

export default mongoose.model('UserProgress', UserProgressSchema);

