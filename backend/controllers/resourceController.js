import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Resource from '../models/Resource.js';
import Subscription from '../models/Subscription.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import DownloadHistory from '../models/DownloadHistory.js';
import User from '../models/User.js';
import { logActivity } from '../services/activityService.js';
import { createNotification } from '../services/notificationService.js';
import { generateResourcePdf } from '../services/pdfGeneratorService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const resolveResourcePath = (resource) => {
  const slugFile = `${resource.slug}.pdf`;
  const candidates = [
    resource.filePath ? path.resolve(process.cwd(), resource.filePath) : null,
    resource.filePath ? path.resolve(process.cwd(), 'backend', resource.filePath) : null,
    path.resolve(__dirname, '../uploads/resources', slugFile),
    path.resolve(process.cwd(), 'backend/uploads/resources', slugFile),
    path.resolve(process.cwd(), 'uploads/resources', slugFile),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return path.resolve(__dirname, '../uploads/resources', slugFile);
};

// @desc    Get all resources with search, filter, and pagination
// @route   GET /api/resources
// @access  Public / Authenticated
export const getResources = async (req, res, next) => {
  try {
    const { category, planLevel, search, sort } = req.query;

    const query = { isActive: true };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (planLevel && planLevel !== 'All') {
      query.planLevelRequired = planLevel;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    let queryExec = Resource.find(query);

    if (sort === 'popular') {
      queryExec = queryExec.sort({ downloadCount: -1 });
    } else if (sort === 'alphabetical' || sort === 'name') {
      queryExec = queryExec.sort({ title: 1 }).collation({ locale: 'en', strength: 2 });
    } else if (sort === 'oldest') {
      queryExec = queryExec.sort({ createdAt: 1 });
    } else {
      queryExec = queryExec.sort({ createdAt: -1 });
    }

    const resources = await queryExec;

    res.status(200).json({
      success: true,
      count: resources.length,
      resources,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Public
export const getResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    res.status(200).json({ success: true, resource });
  } catch (err) {
    next(err);
  }
};

// @desc    Download resource with rigorous backend subscription & quota enforcement
// @route   POST /api/resources/:id/download
// @access  Private
export const downloadResource = async (req, res, next) => {
  try {
    const resourceId = req.params.id;
    const user = req.user;

    // 1. Fetch Resource
    const resource = await Resource.findById(resourceId);
    if (!resource || !resource.isActive) {
      return res.status(404).json({ success: false, message: 'Resource not found or is currently inactive.' });
    }

    // 2. Fetch User's Active Subscription
    let activeSub = await Subscription.findOne({
      user: user._id,
      status: 'Active',
    }).populate('plan');

    // Default to Free Plan if none exists or has expired
    let userPlan;
    if (!activeSub || (activeSub.endDate && new Date(activeSub.endDate) < new Date())) {
      userPlan = await SubscriptionPlan.findOne({ slug: 'free' });
    } else {
      userPlan = activeSub.plan;
    }

    if (!userPlan) {
      userPlan = { tierLevel: 0, name: 'Free', quotas: { dailyDownloads: 3, monthlyDownloads: 20 } };
    }

    // 3. Verify Tier Level Required
    if (userPlan.tierLevel < resource.tierLevelRequired) {
      return res.status(403).json({
        success: false,
        message: `This resource requires the ${resource.planLevelRequired} membership tier or higher. Please upgrade your plan to unlock access.`,
        requiredPlan: resource.planLevelRequired,
        currentPlan: userPlan.name,
      });
    }

    // 4. Verify Daily and Monthly Download Quota
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Count downloads today from DownloadHistory in MongoDB
    const todayDownloadsCount = await DownloadHistory.countDocuments({
      user: user._id,
      downloadedAt: { $gte: todayStart },
    });

    const monthlyDownloadsCount = await DownloadHistory.countDocuments({
      user: user._id,
      downloadedAt: { $gte: monthStart },
    });

    const maxDaily = userPlan.quotas ? userPlan.quotas.dailyDownloads : 3;
    const maxMonthly = userPlan.quotas ? userPlan.quotas.monthlyDownloads : 20;

    if (todayDownloadsCount >= maxDaily) {
      // Send quota warning notification
      await createNotification({
        userId: user._id,
        title: 'Daily Download Quota Reached',
        message: `You have consumed all ${maxDaily} daily downloads for your ${userPlan.name} plan. Upgrade to Bronze, Silver, or Gold for higher quotas.`,
        type: 'quota',
        link: '/plans',
      });

      return res.status(429).json({
        success: false,
        message: `Daily download limit reached (${todayDownloadsCount}/${maxDaily}). Upgrade your membership or check back tomorrow!`,
        quotaExceeded: 'daily',
        limit: maxDaily,
        used: todayDownloadsCount,
      });
    }

    if (monthlyDownloadsCount >= maxMonthly) {
      return res.status(429).json({
        success: false,
        message: `Monthly download quota reached (${monthlyDownloadsCount}/${maxMonthly}). Please upgrade your plan for additional capacity.`,
        quotaExceeded: 'monthly',
        limit: maxMonthly,
        used: monthlyDownloadsCount,
      });
    }

    // 5. Verify physical PDF document exists or generate it before quota deduction
    const resolvedPath = resolveResourcePath(resource);

    if (!fs.existsSync(resolvedPath)) {
      try {
        await generateResourcePdf(resource);
      } catch (pdfErr) {
        console.error('On-the-fly PDF creation error:', pdfErr);
        return res.status(500).json({
          success: false,
          message: 'Unable to locate or generate the publication PDF document. Please contact support.',
        });
      }
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({
        success: false,
        message: 'Resource PDF file is unavailable on the storage server.',
      });
    }

    // 6. Increment resource download count
    resource.downloadCount = (resource.downloadCount || 0) + 1;
    await resource.save();

    // 7. Record activity in DownloadHistory collection
    const downloadRecord = await DownloadHistory.create({
      user: user._id,
      resource: resource._id,
      planAtDownload: userPlan.name,
      tierLevelAtDownload: userPlan.tierLevel,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      downloadedAt: new Date(),
    });

    // Update user cached quota fields
    await User.findByIdAndUpdate(user._id, {
      $inc: { 'usageQuota.dailyDownloadsUsed': 1, 'usageQuota.monthlyDownloadsUsed': 1 },
      'usageQuota.lastQuotaResetDate': new Date(),
    });

    // 8. Log Activity
    await logActivity({
      userId: user._id,
      action: 'DOWNLOAD',
      details: `Downloaded resource "${resource.title}" under ${userPlan.name} plan.`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Direct binary download if requested via query
    if (req.query.file === 'true' || req.query.stream === 'true') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${resource.slug}.pdf"`);
      return res.download(resolvedPath, `${resource.slug}.pdf`);
    }

    const token = req.query.token || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : '');
    const directFileUrl = `/api/resources/${resource._id}/file?token=${encodeURIComponent(token)}`;

    // Return resource payload & download authorization
    res.status(200).json({
      success: true,
      message: `Download granted! Enjoy "${resource.title}".`,
      downloadRecord,
      downloadUrl: directFileUrl,
      resource: {
        id: resource._id,
        title: resource.title,
        slug: resource.slug,
        fileType: resource.fileType || 'PDF',
        fileSize: resource.fileSize,
        pageCount: resource.pageCount || 8,
        downloadUrl: directFileUrl,
        fileContent: resource.fileContent,
      },
      remainingDailyQuota: Math.max(0, maxDaily - (todayDownloadsCount + 1)),
      maxDailyQuota: maxDaily,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Download the genuine PDF file stream
// @route   GET /api/resources/:id/file
// @access  Private
export const downloadResourceFile = async (req, res, next) => {
  try {
    const resourceId = req.params.id;
    const user = req.user;

    const resource = await Resource.findById(resourceId);
    if (!resource || !resource.isActive) {
      return res.status(404).json({ success: false, message: 'Resource not found or is currently inactive.' });
    }

    // Verify User's Active Subscription
    let activeSub = await Subscription.findOne({
      user: user._id,
      status: 'Active',
    }).populate('plan');

    let userPlan = activeSub && (!activeSub.endDate || new Date(activeSub.endDate) >= new Date())
      ? activeSub.plan
      : await SubscriptionPlan.findOne({ slug: 'free' });

    if (!userPlan) {
      userPlan = { tierLevel: 0, name: 'Free' };
    }

    if (userPlan.tierLevel < resource.tierLevelRequired) {
      return res.status(403).json({
        success: false,
        message: `This resource requires the ${resource.planLevelRequired} membership tier or higher.`,
      });
    }

    const resolvedPath = resolveResourcePath(resource);

    if (!fs.existsSync(resolvedPath)) {
      try {
        await generateResourcePdf(resource);
      } catch (genErr) {
        return res.status(500).json({ success: false, message: 'Could not generate PDF document.' });
      }
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ success: false, message: 'PDF document not found on server.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${resource.slug}.pdf"`);
    res.download(resolvedPath, `${resource.slug}.pdf`);
  } catch (err) {
    next(err);
  }
};

// @desc    Get resource preview details and table of contents
// @route   GET /api/resources/:id/preview
// @access  Public / Private
export const getResourcePreview = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource || !resource.isActive) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    res.status(200).json({
      success: true,
      preview: {
        id: resource._id,
        title: resource.title,
        slug: resource.slug,
        description: resource.description,
        category: resource.category,
        planLevelRequired: resource.planLevelRequired,
        tierLevelRequired: resource.tierLevelRequired,
        pageCount: resource.pageCount || 8,
        fileSize: resource.fileSize,
        fileType: resource.fileType || 'PDF',
        author: resource.author || 'SubSync Research & Engineering Labs',
        version: resource.version || 'v2026.1',
        tableOfContents: resource.tableOfContents || [],
        highlights: resource.highlights || [],
        tags: resource.tags || [],
        downloadCount: resource.downloadCount || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's download history
// @route   GET /api/resources/my-downloads
// @access  Private
export const getMyDownloads = async (req, res, next) => {
  try {
    const downloads = await DownloadHistory.find({ user: req.user._id })
      .populate('resource')
      .sort({ downloadedAt: -1 });

    res.status(200).json({
      success: true,
      count: downloads.length,
      downloads,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new resource (Admin)
// @route   POST /api/resources
// @access  Private/Admin
export const createResource = async (req, res, next) => {
  try {
    const { title, description, category, planLevelRequired, fileType, fileSize, fileContent, tags } = req.body;

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const tierMap = { Free: 0, Bronze: 1, Silver: 2, Gold: 3 };

    const resource = await Resource.create({
      title,
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      description,
      category,
      planLevelRequired: planLevelRequired || 'Free',
      tierLevelRequired: tierMap[planLevelRequired] || 0,
      fileType: fileType || 'PDF',
      fileSize: fileSize || '2.5 MB',
      fileContent: fileContent || 'Resource file data generated by SubSync.',
      tags: tags || [],
    });

    res.status(201).json({
      success: true,
      message: 'Resource published successfully.',
      resource,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update resource (Admin)
// @route   PUT /api/resources/:id
// @access  Private/Admin
export const updateResource = async (req, res, next) => {
  try {
    const tierMap = { Free: 0, Bronze: 1, Silver: 2, Gold: 3 };
    const updates = { ...req.body };
    if (updates.planLevelRequired) {
      updates.tierLevelRequired = tierMap[updates.planLevelRequired] ?? 0;
    }

    const resource = await Resource.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Resource updated successfully.',
      resource,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete resource (Admin)
// @route   DELETE /api/resources/:id
// @access  Private/Admin
export const deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    await resource.deleteOne();
    res.status(200).json({ success: true, message: 'Resource deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle bookmark for current user
// @route   POST /api/resources/:id/bookmark
// @access  Private
export const toggleBookmark = async (req, res, next) => {
  try {
    const resourceId = req.params.id;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.bookmarks) {
      user.bookmarks = [];
    }

    const index = user.bookmarks.indexOf(resourceId);
    let isBookmarked = false;

    if (index > -1) {
      user.bookmarks.splice(index, 1);
      isBookmarked = false;
    } else {
      user.bookmarks.push(resourceId);
      isBookmarked = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      isBookmarked,
      bookmarks: user.bookmarks,
      message: isBookmarked ? 'Resource bookmarked.' : 'Bookmark removed.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's bookmarked resources
// @route   GET /api/resources/user/bookmarks
// @access  Private
export const getBookmarkedResources = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'bookmarks',
      match: { isActive: true },
    });

    res.status(200).json({
      success: true,
      bookmarks: user?.bookmarks || [],
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Record recently viewed resource
// @route   POST /api/resources/:id/view
// @access  Private
export const recordRecentlyViewed = async (req, res, next) => {
  try {
    const resourceId = req.params.id;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.recentlyViewed) {
      user.recentlyViewed = [];
    }

    // Filter out previous occurrence if any
    user.recentlyViewed = user.recentlyViewed.filter(
      (item) => item.resource && item.resource.toString() !== resourceId
    );

    // Add to top
    user.recentlyViewed.unshift({
      resource: resourceId,
      viewedAt: new Date(),
    });

    // Keep top 20
    if (user.recentlyViewed.length > 20) {
      user.recentlyViewed = user.recentlyViewed.slice(0, 20);
    }

    await user.save();

    res.status(200).json({ success: true, message: 'View recorded.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's recently viewed resources
// @route   GET /api/resources/user/recently-viewed
// @access  Private
export const getRecentlyViewedResources = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'recentlyViewed.resource',
      match: { isActive: true },
    });

    const items = (user?.recentlyViewed || [])
      .filter((item) => item.resource)
      .map((item) => ({
        ...item.resource.toObject(),
        viewedAt: item.viewedAt,
      }));

    res.status(200).json({
      success: true,
      recentlyViewed: items,
    });
  } catch (err) {
    next(err);
  }
};
