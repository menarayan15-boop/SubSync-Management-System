import mongoose from 'mongoose';

const scannedDocumentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileMimeType: {
      type: String,
      required: true,
      enum: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    },
    fileSize: {
      type: Number,
      required: true,
      max: [10 * 1024 * 1024, 'File size cannot exceed 10MB'],
    },
    storagePath: {
      type: String,
      required: true,
    },
    scanStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    extractedData: {
      serviceName: { type: String, default: '' },
      providerName: { type: String, default: '' },
      amount: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      billingFrequency: {
        type: String,
        enum: ['monthly', 'quarterly', 'yearly', 'weekly', 'one-time', 'unknown'],
        default: 'unknown',
      },
      purchaseDate: { type: Date },
      nextRenewalDate: { type: Date },
      invoiceReference: { type: String, default: '' },
      subscriptionStatus: { type: String, default: 'Active' },
      confidenceScore: { type: Number, default: 0, min: 0, max: 100 },
      rawText: { type: String, default: '' },
    },
    reviewStatus: {
      type: String,
      enum: ['pending_review', 'confirmed_saved', 'discarded'],
      default: 'pending_review',
      index: true,
    },
    savedSubscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrackedSubscription',
    },
    failureReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

scannedDocumentSchema.index({ user: 1, createdAt: -1 });

const ScannedDocument = mongoose.model('ScannedDocument', scannedDocumentSchema);

export default ScannedDocument;

