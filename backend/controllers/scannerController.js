import fs from 'fs';
import path from 'path';
import multer from 'multer';
import crypto from 'crypto';
import ScannedDocument from '../models/ScannedDocument.js';
import TrackedSubscription from '../models/TrackedSubscription.js';
import { extractTextFromFile, parseSubscriptionText, detectDuplicateSubscription } from '../services/ocrService.js';
import { logActivity } from '../services/activityService.js';

// Configure Multer storage for private uploads
const uploadDir = path.resolve('backend/uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    cb(null, `doc_${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.'), false);
  }
};

export const documentUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB maximum limit
  },
});

// @desc    Upload document and perform OCR extraction
// @route   POST /api/scanner/upload
// @access  Private
export const uploadAndScanDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF or image file.' });
    }

    const { filename, originalname, mimetype, size, path: filePath } = req.file;

    // Create ScannedDocument entry in pending state
    const scannedDoc = await ScannedDocument.create({
      user: req.user._id,
      fileName: filename,
      originalName: originalname,
      fileMimeType: mimetype,
      fileSize: size,
      storagePath: filePath,
      scanStatus: 'processing',
      reviewStatus: 'pending_review',
    });

    try {
      // 1. Run genuine OCR extraction
      const rawText = await extractTextFromFile(filePath, mimetype);

      if (!rawText || rawText.trim().length === 0) {
        scannedDoc.scanStatus = 'failed';
        scannedDoc.failureReason = 'OCR process was unable to recognize readable text in this document.';
        await scannedDoc.save();

        return res.status(200).json({
          success: true,
          status: 'failed',
          message: 'Document uploaded, but no text could be recognized. You may enter details manually.',
          document: scannedDoc,
          duplicateCheck: { isDuplicate: false },
        });
      }

      // 2. Parse subscription attributes
      const extractedData = parseSubscriptionText(rawText);

      // 3. Check for potential duplicate subscriptions
      const duplicateCheck = await detectDuplicateSubscription(req.user._id, extractedData);

      // 4. Update document record with completed data
      scannedDoc.scanStatus = 'completed';
      scannedDoc.extractedData = extractedData;
      await scannedDoc.save();

      await logActivity({
        userId: req.user._id,
        action: 'DOCUMENT_SCANNED',
        details: `Scanned document "${originalname}". Extracted service "${extractedData.serviceName}" (₹${extractedData.amount}).`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(200).json({
        success: true,
        status: 'completed',
        message: 'Document scanned and information extracted successfully!',
        document: scannedDoc,
        duplicateCheck,
      });
    } catch (scanError) {
      console.error('[Scanner Controller] OCR extraction failure:', scanError.message);
      scannedDoc.scanStatus = 'failed';
      scannedDoc.failureReason = scanError.message || 'Error occurred during text extraction';
      await scannedDoc.save();

      res.status(200).json({
        success: true,
        status: 'failed',
        message: `OCR processing encountered an issue: ${scanError.message}`,
        document: scannedDoc,
        duplicateCheck: { isDuplicate: false },
      });
    }
  } catch (err) {
    // If multer or database threw error and file was created, clean up
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanErr) {
        console.warn('Failed to clean up uploaded file:', cleanErr.message);
      }
    }
    next(err);
  }
};

// @desc    Get Scanner Dashboard summary statistics
// @route   GET /api/scanner/dashboard
// @access  Private
export const getScannerDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [totalScanned, successfulScans, pendingReviews, failedScans, recentDocs, trackedSubs] =
      await Promise.all([
        ScannedDocument.countDocuments({ user: userId }),
        ScannedDocument.countDocuments({ user: userId, scanStatus: 'completed' }),
        ScannedDocument.countDocuments({ user: userId, reviewStatus: 'pending_review' }),
        ScannedDocument.countDocuments({ user: userId, scanStatus: 'failed' }),
        ScannedDocument.find({ user: userId }).sort({ createdAt: -1 }).limit(10),
        TrackedSubscription.find({ user: userId, status: { $ne: 'Cancelled' } }).sort({ nextRenewalDate: 1 }),
      ]);

    res.status(200).json({
      success: true,
      stats: {
        totalScanned,
        successfulScans,
        pendingReviews,
        failedScans,
        activeTrackedCount: trackedSubs.length,
      },
      recentDocuments: recentDocs,
      activeSubscriptions: trackedSubs.slice(0, 5),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get paginated scanned documents
// @route   GET /api/scanner/documents
// @access  Private
export const getScannedDocuments = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    const filter = { user: userId };
    if (req.query.status) {
      filter.scanStatus = req.query.status;
    }
    if (req.query.reviewStatus) {
      filter.reviewStatus = req.query.reviewStatus;
    }

    const [documents, total] = await Promise.all([
      ScannedDocument.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('savedSubscription', 'name amount billingCycle status'),
      ScannedDocument.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      documents,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Securely view/stream document file (authenticated & owner check)
// @route   GET /api/scanner/document/:id/file
// @access  Private
export const streamDocumentFile = async (req, res, next) => {
  try {
    const document = await ScannedDocument.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Verify ownership (IDOR prevention)
    if (document.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this document.' });
    }

    if (!fs.existsSync(document.storagePath)) {
      return res.status(404).json({ success: false, message: 'File is no longer stored on the server.' });
    }

    res.setHeader('Content-Type', document.fileMimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.originalName)}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const fileStream = fs.createReadStream(document.storagePath);
    fileStream.pipe(res);
  } catch (err) {
    next(err);
  }
};

// @desc    Confirm and save extracted details as a TrackedSubscription
// @route   POST /api/scanner/confirm/:id
// @access  Private
export const confirmAndSaveSubscription = async (req, res, next) => {
  try {
    const document = await ScannedDocument.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Scanned document not found.' });
    }

    if (document.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access.' });
    }

    const {
      serviceName,
      providerName,
      amount,
      currency = 'INR',
      billingFrequency = 'monthly',
      category = 'Other',
      startDate,
      nextRenewalDate,
      notes = '',
    } = req.body;

    if (!serviceName || !serviceName.trim()) {
      return res.status(400).json({ success: false, message: 'Subscription name is required.' });
    }

    if (amount === undefined || isNaN(Number(amount)) || Number(amount) < 0) {
      return res.status(400).json({ success: false, message: 'A valid subscription amount is required.' });
    }

    // Create the TrackedSubscription in MongoDB
    const trackedSub = await TrackedSubscription.create({
      user: req.user._id,
      name: serviceName.trim(),
      provider: providerName ? providerName.trim() : serviceName.trim(),
      amount: Number(amount),
      currency: currency.toUpperCase().trim(),
      billingCycle: ['monthly', 'quarterly', 'yearly', 'weekly', 'one-time'].includes(billingFrequency)
        ? billingFrequency
        : 'monthly',
      category,
      startDate: startDate ? new Date(startDate) : new Date(),
      nextRenewalDate: nextRenewalDate ? new Date(nextRenewalDate) : undefined,
      status: 'Active',
      notes: notes.slice(0, 500),
      sourceDocument: document._id,
    });

    // Mark document as confirmed and link saved subscription
    document.reviewStatus = 'confirmed_saved';
    document.savedSubscription = trackedSub._id;
    await document.save();

    await logActivity({
      userId: req.user._id,
      action: 'SUBSCRIPTION_CONFIRMED',
      details: `Saved new tracked subscription "${trackedSub.name}" (₹${trackedSub.amount}/${trackedSub.billingCycle}) from scanned document.`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      message: `Subscription "${trackedSub.name}" saved to your manager successfully!`,
      subscription: trackedSub,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete scanned document and unlink file from disk
// @route   DELETE /api/scanner/document/:id
// @access  Private
export const deleteScannedDocument = async (req, res, next) => {
  try {
    const document = await ScannedDocument.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    if (document.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this document.' });
    }

    // Safely remove file from private disk storage
    if (document.storagePath && fs.existsSync(document.storagePath)) {
      try {
        fs.unlinkSync(document.storagePath);
      } catch (fileErr) {
        console.warn('Failed to delete file from disk:', fileErr.message);
      }
    }

    await ScannedDocument.findByIdAndDelete(document._id);

    await logActivity({
      userId: req.user._id,
      action: 'DOCUMENT_DELETED',
      details: `Deleted scanned document "${document.originalName}".`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: 'Document and stored file removed successfully.',
    });
  } catch (err) {
    next(err);
  }
};

