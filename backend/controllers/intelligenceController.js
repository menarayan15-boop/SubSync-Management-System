import SubscriptionPlan from '../models/SubscriptionPlan.js';
import Subscription from '../models/Subscription.js';
import DownloadHistory from '../models/DownloadHistory.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import {
  generateSubscriptionAdvice,
  detectSubscriptionWaste,
  simulateSubscriptionCost,
} from '../services/intelligenceService.js';

// @desc    Get AI/Algorithmic Subscription Advice
// @route   GET /api/intelligence/advisor
// @access  Private
export const getSubscriptionAdvice = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const subscription = await Subscription.findOne({
      user: req.user._id,
      status: 'Active',
    }).populate('plan');

    const [downloadHistory, payments, allPlans] = await Promise.all([
      DownloadHistory.find({ user: req.user._id }).sort({ downloadedAt: -1 }),
      Payment.find({ user: req.user._id }),
      SubscriptionPlan.find({ isActive: true }).sort({ sortOrder: 1 }),
    ]);

    const advice = generateSubscriptionAdvice({
      user,
      subscription,
      downloadHistory,
      payments,
      allPlans,
    });

    res.status(200).json({
      success: true,
      advice,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Detect Unused Benefits & Subscription Waste
// @route   GET /api/intelligence/waste-detector
// @access  Private
export const getWasteDetectorAnalysis = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      user: req.user._id,
      status: 'Active',
    }).populate('plan');

    const [downloadHistory, payments, allPlans] = await Promise.all([
      DownloadHistory.find({ user: req.user._id }),
      Payment.find({ user: req.user._id }),
      SubscriptionPlan.find({ isActive: true }),
    ]);

    const wasteAnalysis = detectSubscriptionWaste({
      subscription,
      downloadHistory,
      payments,
      allPlans,
    });

    res.status(200).json({
      success: true,
      wasteAnalysis,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Simulate Cost for 3, 6, 12 months
// @route   POST /api/intelligence/simulate-cost
// @access  Private
export const simulateCost = async (req, res, next) => {
  try {
    const { targetPlanSlug = 'silver', durationMonths = 6 } = req.body;

    const subscription = await Subscription.findOne({
      user: req.user._id,
      status: 'Active',
    }).populate('plan');

    const allPlans = await SubscriptionPlan.find({ isActive: true }).sort({ sortOrder: 1 });
    const currentPlanSlug = subscription?.plan?.slug || 'free';

    const simulation = simulateSubscriptionCost({
      targetPlanSlug,
      durationMonths: Number(durationMonths) || 6,
      allPlans,
      currentPlanSlug,
    });

    res.status(200).json({
      success: true,
      simulation,
    });
  } catch (err) {
    next(err);
  }
};

