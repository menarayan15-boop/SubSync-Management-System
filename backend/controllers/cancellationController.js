import fs from 'fs';
import path from 'path';
import multer from 'multer';
import crypto from 'crypto';
import CancellationWorkflow from '../models/CancellationWorkflow.js';
import TrackedSubscription from '../models/TrackedSubscription.js';
import { CANCELLATION_CATALOG } from '../services/cancellationGuides.js';
import { logActivity } from '../services/activityService.js';

// Setup private storage for cancellation evidence
const evidenceDir = path.resolve('backend/uploads/evidence');
if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, evidenceDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    cb(null, `evidence_${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG proof files are allowed.'), false);
  }
};

export const evidenceUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// @desc    Get pre-verified cancellation guides catalog
// @route   GET /api/cancellation/guides
// @access  Private
export const getCancellationGuides = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    let guides = [...CANCELLATION_CATALOG];

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      guides = guides.filter(
        (g) => g.name.toLowerCase().includes(q) || g.category.toLowerCase().includes(q)
      );
    }

    if (category && category !== 'All') {
      guides = guides.filter((g) => g.category.toLowerCase() === category.toLowerCase());
    }

    res.status(200).json({
      success: true,
      guides,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's cancellation workflows & eligible tracked subscriptions
// @route   GET /api/cancellation/workflows
// @access  Private
export const getCancellationWorkflows = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [workflows, trackedSubscriptions] = await Promise.all([
      CancellationWorkflow.find({ user: userId })
        .sort({ updatedAt: -1 })
        .populate('trackedSubscription', 'name amount billingCycle category nextRenewalDate status'),
      TrackedSubscription.find({ user: userId, status: { $ne: 'Cancelled' } }).sort({ nextRenewalDate: 1 }),
    ]);

    // Active workflow subscription IDs to filter available
    const activeWorkflowSubIds = workflows
      .filter((w) => !['Cancelled', 'Cancellation Failed'].includes(w.status))
      .map((w) => w.trackedSubscription?._id?.toString() || w.trackedSubscription?.toString())
      .filter(Boolean);

    const availableToCancel = trackedSubscriptions.map((sub) => ({
      id: sub._id,
      name: sub.name,
      amount: sub.amount,
      currency: sub.currency,
      billingCycle: sub.billingCycle,
      category: sub.category,
      nextRenewalDate: sub.nextRenewalDate,
      hasActiveWorkflow: activeWorkflowSubIds.includes(sub._id.toString()),
    }));

    res.status(200).json({
      success: true,
      workflows,
      availableSubscriptions: availableToCancel,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Initiate a new cancellation workflow
// @route   POST /api/cancellation/start
// @access  Private
export const startCancellationWorkflow = async (req, res, next) => {
  try {
    const {
      trackedSubscriptionId,
      serviceName,
      guideId,
      renewalDate,
      amount,
      currency = 'INR',
      userNotes = '',
    } = req.body;

    if (!serviceName || !serviceName.trim()) {
      return res.status(400).json({ success: false, message: 'Service name is required.' });
    }

    // Match guide from official catalog
    let matchedGuide = null;
    if (guideId) {
      matchedGuide = CANCELLATION_CATALOG.find((g) => g.id === guideId);
    }
    if (!matchedGuide) {
      const q = serviceName.toLowerCase().trim();
      matchedGuide = CANCELLATION_CATALOG.find(
        (g) => g.name.toLowerCase().includes(q) || q.includes(g.name.toLowerCase())
      );
    }

    // Calculate reminder date (default 3 days before renewal)
    let parsedRenewal = renewalDate ? new Date(renewalDate) : null;
    let reminderDate = null;
    const reminderDays = matchedGuide?.recommendedDaysBeforeRenewal || 3;

    if (parsedRenewal && !isNaN(parsedRenewal.getTime())) {
      reminderDate = new Date(parsedRenewal);
      reminderDate.setDate(reminderDate.getDate() - reminderDays);
    }

    const workflow = await CancellationWorkflow.create({
      user: req.user._id,
      trackedSubscription: trackedSubscriptionId || undefined,
      serviceName: serviceName.trim(),
      amount: Number(amount) || 0,
      currency: currency.toUpperCase().trim(),
      renewalDate: parsedRenewal,
      status: 'Not Started',
      officialCancelUrl: matchedGuide?.directCancelUrl || matchedGuide?.officialUrl || '',
      accountSettingsPath: matchedGuide?.accountSettingsPath || 'Sign in to account settings to cancel subscription',
      stepByStepGuide: matchedGuide?.stepByStepGuide || [
        'Log in to your account on the provider website.',
        'Navigate to Account Settings or Billing.',
        'Select Cancel Subscription or Turn Off Auto-Renew.',
        'Confirm cancellation on the final step.',
      ],
      policyNotes: matchedGuide?.policyNotes || 'Subscriptions generally remain accessible until the end of the paid term.',
      warnings: matchedGuide?.warnings || [],
      reminderEnabled: true,
      reminderDaysBefore: reminderDays,
      reminderDate,
      userNotes: userNotes.slice(0, 1000),
      history: [
        {
          status: 'Not Started',
          note: 'Cancellation workflow initiated in SubSync.',
          timestamp: new Date(),
        },
      ],
    });

    // If linked to TrackedSubscription, update its reference
    if (trackedSubscriptionId) {
      await TrackedSubscription.findByIdAndUpdate(trackedSubscriptionId, {
        cancellationWorkflow: workflow._id,
      });
    }

    await logActivity({
      userId: req.user._id,
      action: 'CANCELLATION_WORKFLOW_STARTED',
      details: `Started cancellation assistant for "${serviceName}".`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      message: `Cancellation assistant started for ${serviceName}.`,
      workflow,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update status of cancellation workflow
// @route   PUT /api/cancellation/:id/status
// @access  Private
export const updateCancellationStatus = async (req, res, next) => {
  try {
    const { status, note = '' } = req.body;
    const validStatuses = [
      'Not Started',
      'Instructions Viewed',
      'Cancellation Requested',
      'Awaiting Confirmation',
      'Cancelled',
      'Cancellation Failed',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid cancellation status.' });
    }

    const workflow = await CancellationWorkflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Cancellation workflow not found.' });
    }

    if (workflow.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access.' });
    }

    workflow.status = status;
    if (note) {
      workflow.userNotes = (workflow.userNotes ? workflow.userNotes + '\n' : '') + note;
    }

    if (status === 'Cancelled') {
      workflow.confirmedAt = new Date();
      // If linked to a TrackedSubscription, mark it cancelled in DB
      if (workflow.trackedSubscription) {
        await TrackedSubscription.findByIdAndUpdate(workflow.trackedSubscription, {
          status: 'Cancelled',
        });
      }
    }

    workflow.history.push({
      status,
      note: note || `Status progressed to ${status}`,
      timestamp: new Date(),
    });

    await workflow.save();

    await logActivity({
      userId: req.user._id,
      action: 'CANCELLATION_STATUS_UPDATED',
      details: `Updated cancellation status for "${workflow.serviceName}" to "${status}".`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: `Status updated to "${status}".`,
      workflow,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload evidence / proof of cancellation
// @route   POST /api/cancellation/:id/evidence
// @access  Private
export const uploadCancellationEvidence = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image or PDF proof.' });
    }

    const workflow = await CancellationWorkflow.findById(req.params.id);
    if (!workflow) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Workflow not found.' });
    }

    if (workflow.user.toString() !== req.user._id.toString()) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(403).json({ success: false, message: 'Unauthorized access.' });
    }

    // Clean up old evidence file if previously uploaded
    if (workflow.evidence?.storagePath && fs.existsSync(workflow.evidence.storagePath)) {
      try {
        fs.unlinkSync(workflow.evidence.storagePath);
      } catch (e) {
        console.warn('Could not remove old evidence:', e.message);
      }
    }

    workflow.evidence = {
      originalName: req.file.originalname,
      fileName: req.file.filename,
      mimeType: req.file.mimetype,
      storagePath: req.file.path,
      uploadedAt: new Date(),
    };

    // Auto progress to Awaiting Confirmation if was Not Started
    if (['Not Started', 'Instructions Viewed'].includes(workflow.status)) {
      workflow.status = 'Awaiting Confirmation';
    }

    workflow.history.push({
      status: workflow.status,
      note: `Uploaded cancellation evidence: "${req.file.originalname}".`,
      timestamp: new Date(),
    });

    await workflow.save();

    res.status(200).json({
      success: true,
      message: 'Cancellation evidence uploaded successfully!',
      workflow,
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanErr) {
        console.warn('Could not clean up evidence file:', cleanErr.message);
      }
    }
    next(err);
  }
};

// @desc    Stream uploaded cancellation evidence file securely
// @route   GET /api/cancellation/:id/evidence-file
// @access  Private
export const streamCancellationEvidence = async (req, res, next) => {
  try {
    const workflow = await CancellationWorkflow.findById(req.params.id);
    if (!workflow || !workflow.evidence?.storagePath) {
      return res.status(404).json({ success: false, message: 'Evidence file not found.' });
    }

    if (workflow.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access.' });
    }

    if (!fs.existsSync(workflow.evidence.storagePath)) {
      return res.status(404).json({ success: false, message: 'File is no longer stored on disk.' });
    }

    res.setHeader('Content-Type', workflow.evidence.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(workflow.evidence.originalName)}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const fileStream = fs.createReadStream(workflow.evidence.storagePath);
    fileStream.pipe(res);
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a cancellation workflow
// @route   DELETE /api/cancellation/:id
// @access  Private
export const deleteCancellationWorkflow = async (req, res, next) => {
  try {
    const workflow = await CancellationWorkflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found.' });
    }

    if (workflow.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access.' });
    }

    if (workflow.evidence?.storagePath && fs.existsSync(workflow.evidence.storagePath)) {
      try {
        fs.unlinkSync(workflow.evidence.storagePath);
      } catch (e) {
        console.warn('Could not remove evidence file:', e.message);
      }
    }

    await CancellationWorkflow.findByIdAndDelete(workflow._id);

    res.status(200).json({
      success: true,
      message: 'Cancellation workflow deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

