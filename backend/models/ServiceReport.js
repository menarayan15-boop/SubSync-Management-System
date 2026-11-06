import mongoose from 'mongoose';

const serviceReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DiscoveryService',
      required: true,
    },
    reportType: {
      type: String,
      enum: ['incorrect_pricing', 'broken_link', 'outdated_features', 'other'],
      default: 'incorrect_pricing',
    },
    details: {
      type: String,
      required: [true, 'Please provide details for your report'],
      maxlength: [1000, 'Details cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const ServiceReport = mongoose.model('ServiceReport', serviceReportSchema);

export default ServiceReport;

