import mongoose from 'mongoose';

const budgetPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    monthlyBudget: {
      type: Number,
      default: 3000,
      min: [0, 'Monthly budget cannot be negative'],
    },
    yearlyBudget: {
      type: Number,
      default: 36000,
      min: [0, 'Yearly budget cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    warningThresholdPercent: {
      type: Number,
      default: 80,
      min: [1, 'Threshold must be at least 1%'],
      max: [100, 'Threshold cannot exceed 100%'],
    },
    categoryBudgets: [
      {
        category: { type: String, required: true },
        monthlyLimit: { type: Number, required: true, min: 0 },
      },
    ],
    alerts: [
      {
        type: {
          type: String,
          enum: [
            'threshold_exceeded',
            'projected_overbudget',
            'multiple_renewals',
            'price_increase',
            'unexpected_payment',
          ],
        },
        message: { type: String, required: true },
        severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'warning' },
        createdAt: { type: Date, default: Date.now },
        isRead: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const BudgetPlan = mongoose.model('BudgetPlan', budgetPlanSchema);

export default BudgetPlan;

