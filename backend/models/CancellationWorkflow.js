import mongoose from 'mongoose';

const cancellationWorkflowSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    trackedSubscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrackedSubscription',
    },
    serviceName: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },
    amount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    renewalDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: [
        'Not Started',
        'Instructions Viewed',
        'Cancellation Requested',
        'Awaiting Confirmation',
        'Cancelled',
        'Cancellation Failed',
      ],
      default: 'Not Started',
      index: true,
    },
    cancellationMethod: {
      type: String,
      default: 'Online Account Settings',
    },
    officialCancelUrl: {
      type: String,
      trim: true,
    },
    accountSettingsPath: {
      type: String,
      default: '',
    },
    stepByStepGuide: {
      type: [String],
      default: [],
    },
    policyNotes: {
      type: String,
      default: '',
    },
    warnings: {
      type: [String],
      default: [],
    },
    reminderEnabled: {
      type: Boolean,
      default: true,
    },
    reminderDaysBefore: {
      type: Number,
      default: 3,
    },
    reminderDate: {
      type: Date,
    },
    reminderStatus: {
      type: String,
      enum: ['pending', 'sent', 'dismissed'],
      default: 'pending',
    },
    evidence: {
      originalName: String,
      fileName: String,
      mimeType: String,
      storagePath: String,
      uploadedAt: Date,
    },
    userNotes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: '',
    },
    confirmedAt: {
      type: Date,
    },
    history: [
      {
        status: { type: String, required: true },
        note: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

cancellationWorkflowSchema.index({ user: 1, status: 1 });

const CancellationWorkflow = mongoose.model('CancellationWorkflow', cancellationWorkflowSchema);

export default CancellationWorkflow;

