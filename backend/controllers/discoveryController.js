import DiscoveryService from '../models/DiscoveryService.js';
import UserWishlist from '../models/UserWishlist.js';
import ServiceReport from '../models/ServiceReport.js';
import TrackedSubscription from '../models/TrackedSubscription.js';
import { logActivity } from '../services/activityService.js';

// @desc    Get filtered list of discovery services
// @route   GET /api/discovery/services
// @access  Public
export const getDiscoveryServices = async (req, res, next) => {
  try {
    const {
      search,
      category,
      billingFrequency,
      isFree,
      minPrice,
      maxPrice,
      sortBy = 'popularity',
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {};

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { shortDescription: { $regex: q, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (billingFrequency && billingFrequency !== 'all') {
      filter['plans.billingFrequency'] = billingFrequency;
    }

    if (isFree === 'true') {
      filter['plans.price'] = 0;
    } else if (minPrice || maxPrice) {
      filter['plans.price'] = {};
      if (minPrice) filter['plans.price'].$gte = Number(minPrice);
      if (maxPrice) filter['plans.price'].$lte = Number(maxPrice);
    }

    // Sort order
    let sortObj = { popularityScore: -1 };
    if (sortBy === 'price_asc') sortObj = { 'plans.0.price': 1 };
    if (sortBy === 'price_desc') sortObj = { 'plans.0.price': -1 };
    if (sortBy === 'name') sortObj = { name: 1 };

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [services, total, categoryCounts] = await Promise.all([
      DiscoveryService.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit, 10)),
      DiscoveryService.countDocuments(filter),
      DiscoveryService.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    ]);

    res.status(200).json({
      success: true,
      services,
      categoryCounts,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get details of a single discovery service
// @route   GET /api/discovery/services/:id
// @access  Public
export const getDiscoveryServiceById = async (req, res, next) => {
  try {
    const service = await DiscoveryService.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }
    res.status(200).json({ success: true, service });
  } catch (err) {
    next(err);
  }
};

// @desc    Compare up to 4 services side-by-side
// @route   POST /api/discovery/compare
// @access  Public
export const compareServices = async (req, res, next) => {
  try {
    const { serviceIds } = req.body;
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide at least 1 service ID to compare.' });
    }

    // Limit to 4 services maximum
    const targetIds = serviceIds.slice(0, 4);
    const services = await DiscoveryService.find({ _id: { $in: targetIds } });

    res.status(200).json({
      success: true,
      comparison: services,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's personal wishlist
// @route   GET /api/discovery/wishlist
// @access  Private
export const getUserWishlist = async (req, res, next) => {
  try {
    let wishlist = await UserWishlist.findOne({ user: req.user._id }).populate('items.service');
    if (!wishlist) {
      wishlist = await UserWishlist.create({ user: req.user._id, items: [] });
    }

    res.status(200).json({
      success: true,
      wishlist: wishlist.items,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle service in user wishlist
// @route   POST /api/discovery/wishlist/toggle
// @access  Private
export const toggleWishlistService = async (req, res, next) => {
  try {
    const { serviceId, interestLevel = 'medium' } = req.body;
    if (!serviceId) {
      return res.status(400).json({ success: false, message: 'Service ID is required.' });
    }

    let wishlist = await UserWishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new UserWishlist({ user: req.user._id, items: [] });
    }

    const index = wishlist.items.findIndex((item) => item.service.toString() === serviceId);
    let inWishlist = false;

    if (index > -1) {
      // Remove from wishlist
      wishlist.items.splice(index, 1);
      inWishlist = false;
    } else {
      // Add to wishlist
      wishlist.items.push({ service: serviceId, interestLevel, addedAt: new Date() });
      inWishlist = true;
    }

    await wishlist.save();

    res.status(200).json({
      success: true,
      inWishlist,
      message: inWishlist ? 'Saved to your wishlist!' : 'Removed from your wishlist.',
      count: wishlist.items.length,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    One-click add discovery service to user's Tracked Subscriptions
// @route   POST /api/discovery/track/:id
// @access  Private
export const trackDiscoveryService = async (req, res, next) => {
  try {
    const service = await DiscoveryService.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Discovery service not found.' });
    }

    const { planIndex = 0 } = req.body;
    const selectedPlan = service.plans[planIndex] || service.plans[0];

    const nextRenewal = new Date();
    if (selectedPlan.billingFrequency === 'yearly') {
      nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
    } else {
      nextRenewal.setMonth(nextRenewal.getMonth() + 1);
    }

    // Map category
    let mappedCategory = 'Other';
    if (service.category.includes('Entertainment')) mappedCategory = 'Entertainment';
    else if (service.category.includes('Productivity')) mappedCategory = 'Productivity';
    else if (service.category.includes('Developer') || service.category.includes('Cloud')) mappedCategory = 'Cloud & Dev';
    else if (service.category.includes('Education')) mappedCategory = 'Education';
    else if (service.category.includes('Fitness')) mappedCategory = 'Health & Fitness';
    else if (service.category.includes('Business')) mappedCategory = 'Business';

    const tracked = await TrackedSubscription.create({
      user: req.user._id,
      name: `${service.name} (${selectedPlan.name})`,
      provider: service.name,
      amount: selectedPlan.price,
      currency: selectedPlan.currency || 'INR',
      billingCycle: selectedPlan.billingFrequency === 'free' ? 'monthly' : selectedPlan.billingFrequency,
      category: mappedCategory,
      startDate: new Date(),
      nextRenewalDate: nextRenewal,
      status: 'Active',
      cancellationUrl: service.officialWebsite,
      notes: `Added from SubSync Discovery Hub (${service.name} ${selectedPlan.name} plan)`,
    });

    await logActivity({
      userId: req.user._id,
      action: 'SERVICE_TRACKED_FROM_DISCOVERY',
      details: `Added "${tracked.name}" to tracked subscriptions from Discovery Hub.`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      message: `"${tracked.name}" is now tracked in your subscriptions!`,
      trackedSubscription: tracked,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Report incorrect pricing or outdated data
// @route   POST /api/discovery/report
// @access  Private
export const reportServiceDiscrepancy = async (req, res, next) => {
  try {
    const { serviceId, reportType = 'incorrect_pricing', details } = req.body;
    if (!serviceId || !details || !details.trim()) {
      return res.status(400).json({ success: false, message: 'Service ID and report details are required.' });
    }

    const report = await ServiceReport.create({
      user: req.user._id,
      service: serviceId,
      reportType,
      details: details.trim().slice(0, 1000),
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your report has been submitted to SubSync administrators for verification.',
      report,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Create new discovery service
// @route   POST /api/discovery/admin/service
// @access  Private/Admin
export const adminCreateService = async (req, res, next) => {
  try {
    const { name, category, shortDescription, fullDescription, plans, officialWebsite, alternatives } = req.body;

    if (!name || !category || !shortDescription || !officialWebsite) {
      return res.status(400).json({ success: false, message: 'Required fields missing.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const service = await DiscoveryService.create({
      name: name.trim(),
      slug,
      category,
      shortDescription,
      fullDescription: fullDescription || '',
      plans: Array.isArray(plans) ? plans : [],
      officialWebsite,
      alternatives: Array.isArray(alternatives) ? alternatives : [],
      lastVerifiedDate: new Date(),
      isVerified: true,
    });

    res.status(201).json({ success: true, message: 'Service added to Discovery Hub!', service });
  } catch (err) {
    next(err);
  }
};

