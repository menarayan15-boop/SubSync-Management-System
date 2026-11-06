import mongoose from 'mongoose';
import crypto from 'crypto';

const CertificateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    certificateId: {
      type: String,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: 'Cross-Disciplinary Learning',
    },
    recipientName: {
      type: String,
      required: true,
    },
    completedResourcesCount: {
      type: Number,
      required: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    issuer: {
      type: String,
      default: 'SubSync Academy & Research Labs',
    },
    verificationUrl: {
      type: String,
      default: '',
    },
    isValid: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

CertificateSchema.pre('save', function (next) {
  if (!this.certificateId) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    this.certificateId = `CERT-SS-${new Date().getFullYear()}-${code}`;
  }
  next();
});

export default mongoose.model('Certificate', CertificateSchema);

