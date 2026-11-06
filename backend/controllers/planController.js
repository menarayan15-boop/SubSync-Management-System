import SubscriptionPlan from '../models/SubscriptionPlan.js';

// @desc    Get all active subscription plans
// @route   GET /api/plans
// @access  Public
export const getPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ sortOrder: 1, tierLevel: 1 });
    res.status(200).json({ success: true, count: plans.length, plans });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single plan by ID or slug
// @route   GET /api/plans/:id
// @access  Public
export const getPlan = async (req, res, next) => {
  try {
    let plan;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      plan = await SubscriptionPlan.findById(req.params.id);
    } else {
      plan = await SubscriptionPlan.findOne({ slug: req.params.id });
    }

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found.' });
    }

    res.status(200).json({ success: true, plan });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new plan (Admin)
// @route   POST /api/plans
// @access  Private/Admin
export const createPlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.create(req.body);
    res.status(201).json({ success: true, message: 'Subscription plan created.', plan });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a plan (Admin)
// @route   PUT /api/plans/:id
// @access  Private/Admin
export const updatePlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }

    res.status(200).json({ success: true, message: 'Plan updated successfully.', plan });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a plan (Admin)
// @route   DELETE /api/plans/:id
// @access  Private/Admin
export const deletePlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }

    // Do not allow deleting Free plan if it's default
    if (plan.slug === 'free') {
      return res.status(400).json({ success: false, message: 'The base Free plan cannot be deleted.' });
    }

    await plan.deleteOne();
    res.status(200).json({ success: true, message: 'Plan removed successfully.' });
  } catch (err) {
    next(err);
  }
};
