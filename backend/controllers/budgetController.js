import BudgetPlan from '../models/BudgetPlan.js';
import {
  calculateUserBudgetAnalytics,
  runWhatIfSimulation,
  generateBudgetCsv,
  generateBudgetPdf,
} from '../services/budgetService.js';
import { logActivity } from '../services/activityService.js';

// @desc    Get user budget overview and analytics
// @route   GET /api/budget
// @access  Private
export const getBudgetOverview = async (req, res, next) => {
  try {
    const analytics = await calculateUserBudgetAnalytics(req.user._id);
    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update budget settings
// @route   PUT /api/budget/settings
// @access  Private
export const updateBudgetSettings = async (req, res, next) => {
  try {
    const { monthlyBudget, yearlyBudget, currency = 'INR', warningThresholdPercent = 80, categoryBudgets } = req.body;

    if (monthlyBudget !== undefined && (isNaN(Number(monthlyBudget)) || Number(monthlyBudget) < 0)) {
      return res.status(400).json({ success: false, message: 'Monthly budget must be a positive number.' });
    }

    let budgetPlan = await BudgetPlan.findOne({ user: req.user._id });
    if (!budgetPlan) {
      budgetPlan = new BudgetPlan({ user: req.user._id });
    }

    if (monthlyBudget !== undefined) {
      budgetPlan.monthlyBudget = Number(monthlyBudget);
      // Auto-compute yearly budget if not explicitly provided
      budgetPlan.yearlyBudget = yearlyBudget !== undefined ? Number(yearlyBudget) : Number(monthlyBudget) * 12;
    }
    if (yearlyBudget !== undefined) budgetPlan.yearlyBudget = Number(yearlyBudget);
    if (currency) budgetPlan.currency = currency.toUpperCase().trim();
    if (warningThresholdPercent !== undefined) {
      budgetPlan.warningThresholdPercent = Math.min(100, Math.max(1, Number(warningThresholdPercent)));
    }
    if (Array.isArray(categoryBudgets)) {
      budgetPlan.categoryBudgets = categoryBudgets;
    }

    await budgetPlan.save();

    await logActivity({
      userId: req.user._id,
      action: 'BUDGET_SETTINGS_UPDATED',
      details: `Updated monthly budget to ₹${budgetPlan.monthlyBudget} (warning at ${budgetPlan.warningThresholdPercent}%).`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const updatedAnalytics = await calculateUserBudgetAnalytics(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Budget settings updated successfully!',
      data: updatedAnalytics,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Simulate what-if budget scenarios
// @route   POST /api/budget/simulate
// @access  Private
export const simulateBudget = async (req, res, next) => {
  try {
    const baselineData = await calculateUserBudgetAnalytics(req.user._id);
    const simulationResult = runWhatIfSimulation(baselineData, req.body || {});

    res.status(200).json({
      success: true,
      simulation: simulationResult,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Export budget spending report in CSV format
// @route   GET /api/budget/export/csv
// @access  Private
export const exportCsvReport = async (req, res, next) => {
  try {
    const budgetData = await calculateUserBudgetAnalytics(req.user._id);
    const csvContent = generateBudgetCsv(budgetData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="subsync_budget_report.csv"');
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};

// @desc    Export budget spending report in PDF format
// @route   GET /api/budget/export/pdf
// @access  Private
export const exportPdfReport = async (req, res, next) => {
  try {
    const budgetData = await calculateUserBudgetAnalytics(req.user._id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="subsync_budget_report.pdf"');

    generateBudgetPdf(budgetData, res);
  } catch (err) {
    next(err);
  }
};

