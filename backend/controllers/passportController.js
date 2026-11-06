import PDFDocument from 'pdfkit';
import UserProgress from '../models/UserProgress.js';
import Certificate from '../models/Certificate.js';
import Resource from '../models/Resource.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { logActivity } from '../services/activityService.js';
import { awardRewardPoints } from '../services/rewardService.js';

// Predefined verified achievement badge specifications
const BADGE_DEFINITIONS = [
  {
    id: 'first_step',
    name: 'First Step',
    description: 'Completed your first technical resource from the Digital Vault',
    icon: 'Sparkles',
    color: 'from-amber-400 to-orange-500',
    criteria: (completions) => completions.length >= 1,
  },
  {
    id: 'knowledge_explorer',
    name: 'Knowledge Explorer',
    description: 'Completed 5 curated publications and research papers',
    icon: 'Compass',
    color: 'from-blue-400 to-indigo-600',
    criteria: (completions) => completions.length >= 5,
  },
  {
    id: 'tech_enthusiast',
    name: 'Tech Enthusiast',
    description: 'Completed 5 software architecture or engineering resources',
    icon: 'Zap',
    color: 'from-purple-400 to-violet-600',
    criteria: (completions) => {
      const techCount = completions.filter((c) =>
        ['Engineering', 'Architecture', 'Security', 'Performance', 'Backend'].some((cat) =>
          (c.category || '').toLowerCase().includes(cat.toLowerCase())
        )
      ).length;
      return techCount >= 5;
    },
  },
  {
    id: 'dedicated_learner',
    name: 'Dedicated Learner',
    description: 'Mastered 10 complete publications in your learning path',
    icon: 'Award',
    color: 'from-emerald-400 to-teal-600',
    criteria: (completions) => completions.length >= 10,
  },
  {
    id: 'consistent_learner',
    name: 'Consistent Learner',
    description: 'Expanded expertise across 3 or more distinct technical disciplines',
    icon: 'Layers',
    color: 'from-rose-400 to-pink-600',
    criteria: (completions) => {
      const categories = new Set(completions.map((c) => c.category || 'General'));
      return categories.size >= 3;
    },
  },
];

// Calculate awarded badges for completions
const evaluateBadges = (completions) => {
  return BADGE_DEFINITIONS.map((badge) => ({
    id: badge.id,
    name: badge.name,
    description: badge.description,
    icon: badge.icon,
    color: badge.color,
    isEarned: badge.criteria(completions),
  }));
};

// @desc    Get user's complete Skill Passport summary
// @route   GET /api/passport/summary
// @access  Private
export const getPassportSummary = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const [completions, totalCatalogCount, certificates] = await Promise.all([
      UserProgress.find({ user: req.user._id, status: 'completed' })
        .populate('resource', 'title slug category fileSize pageCount')
        .sort({ completedAt: -1 }),
      Resource.countDocuments({ isActive: true }),
      Certificate.find({ user: req.user._id, isValid: true }).sort({ issueDate: -1 }),
    ]);

    const totalCompleted = completions.length;
    const catalogCount = Math.max(1, totalCatalogCount);
    const progressPercentage = Math.min(100, Math.round((totalCompleted / catalogCount) * 100));

    // Category breakdown
    const categoryMap = {};
    completions.forEach((c) => {
      const cat = c.category || 'General';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    const categoryBreakdown = Object.keys(categoryMap).map((cat) => ({
      category: cat,
      count: categoryMap[cat],
      percentage: Math.round((categoryMap[cat] / Math.max(1, totalCompleted)) * 100),
    }));

    const badges = evaluateBadges(completions);
    const earnedBadgesCount = badges.filter((b) => b.isEarned).length;

    const publicUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/passport/${user.memberId || user._id}`;

    res.status(200).json({
      success: true,
      passport: {
        user: {
          name: user.name,
          memberId: user.memberId,
          avatar: user.avatar,
          passportPrivacy: user.passportPrivacy || 'public',
          passportBio: user.passportBio || '',
        },
        stats: {
          totalCompleted,
          catalogCount,
          progressPercentage,
          earnedBadgesCount,
          totalBadgesCount: BADGE_DEFINITIONS.length,
          certificatesCount: certificates.length,
        },
        badges,
        certificates,
        recentCompletions: completions.slice(0, 10),
        categoryBreakdown,
        publicUrl,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark a resource as completed
// @route   POST /api/passport/complete/:resourceId
// @access  Private
export const completeResource = async (req, res, next) => {
  try {
    const resourceId = req.params.resourceId;
    const resource = await Resource.findById(resourceId);

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    // Atomic upsert in UserProgress
    let progress = await UserProgress.findOne({ user: req.user._id, resource: resourceId });
    if (!progress) {
      progress = await UserProgress.create({
        user: req.user._id,
        resource: resourceId,
        status: 'completed',
        category: resource.category || 'General',
        completedAt: new Date(),
      });
    } else {
      progress.status = 'completed';
      progress.completedAt = new Date();
      await progress.save();
    }

    // Check updated completions
    const allCompletions = await UserProgress.find({ user: req.user._id, status: 'completed' });
    const completionCount = allCompletions.length;

    // Check certificate generation triggers
    let newCertificate = null;
    if (completionCount >= 5) {
      const existingCert5 = await Certificate.findOne({
        user: req.user._id,
        title: 'SubSync Foundation Specialist Certificate',
      });
      if (!existingCert5) {
        newCertificate = await Certificate.create({
          user: req.user._id,
          recipientName: req.user.name,
          title: 'SubSync Foundation Specialist Certificate',
          category: 'Software Architecture & System Foundations',
          completedResourcesCount: completionCount,
          issueDate: new Date(),
          issuer: 'SubSync Academy & Research Labs',
        });

        await Notification.create({
          user: req.user._id,
          title: 'Official Certificate Issued! 📜',
          message: `Congratulations ${req.user.name}! You unlocked the SubSync Foundation Specialist Certificate for completing 5 technical publications.`,
          category: 'new_resource',
          actionUrl: '/passport',
        });
      }
    }

    if (completionCount >= 10) {
      const existingCert10 = await Certificate.findOne({
        user: req.user._id,
        title: 'SubSync Senior Architect Mastery Certificate',
      });
      if (!existingCert10) {
        newCertificate = await Certificate.create({
          user: req.user._id,
          recipientName: req.user.name,
          title: 'SubSync Senior Architect Mastery Certificate',
          category: 'Distributed Systems & Cloud Engineering',
          completedResourcesCount: completionCount,
          issueDate: new Date(),
          issuer: 'SubSync Academy & Research Labs',
        });

        await Notification.create({
          user: req.user._id,
          title: 'Mastery Certificate Issued! 🏆',
          message: `Sensational achievement! You earned the SubSync Senior Architect Mastery Certificate for completing 10 advanced resources.`,
          category: 'new_resource',
          actionUrl: '/passport',
        });
      }
    }

    // Award +20 loyalty reward points
    try {
      await awardRewardPoints(
        req.user._id,
        'RESOURCE_COMPLETED',
        20,
        `Earned 20 points: Completed "${resource.title}"`,
        { resourceId: resource._id }
      );
    } catch (rewErr) {
      console.warn('Reward points awarding warning:', rewErr.message);
    }

    await logActivity({
      userId: req.user._id,
      action: 'RESOURCE_COMPLETED',
      details: `Completed technical resource "${resource.title}". Total completed: ${completionCount}.`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: `"${resource.title}" marked as completed!`,
      completionCount,
      newCertificate,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update privacy settings of Skill Passport
// @route   PUT /api/passport/privacy
// @access  Private
export const updatePassportPrivacy = async (req, res, next) => {
  try {
    const { passportPrivacy, passportBio } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (passportPrivacy && ['public', 'private'].includes(passportPrivacy)) {
      user.passportPrivacy = passportPrivacy;
    }
    if (typeof passportBio === 'string') {
      user.passportBio = passportBio.slice(0, 250);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Passport privacy preferences updated.',
      privacy: user.passportPrivacy,
      bio: user.passportBio,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get public view of a user's Skill Passport
// @route   GET /api/passport/public/:idOrMemberId
// @access  Public
export const getPublicPassport = async (req, res, next) => {
  try {
    const identifier = req.params.idOrMemberId;

    // Search by memberId or _id
    let user = await User.findOne({ memberId: identifier });
    if (!user && identifier.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(identifier);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Skill Passport not found. Please verify the URL.',
      });
    }

    if (user.passportPrivacy === 'private') {
      return res.status(403).json({
        success: false,
        isPrivate: true,
        message: 'This Skill Passport is private.',
      });
    }

    const [completions, certificates] = await Promise.all([
      UserProgress.find({ user: user._id, status: 'completed' })
        .populate('resource', 'title category')
        .sort({ completedAt: -1 }),
      Certificate.find({ user: user._id, isValid: true }),
    ]);

    const badges = evaluateBadges(completions).filter((b) => b.isEarned);

    res.status(200).json({
      success: true,
      passport: {
        name: user.name,
        memberId: user.memberId,
        avatar: user.avatar,
        bio: user.passportBio || 'Continuous learner on SubSync.',
        memberSince: user.createdAt,
        totalCompleted: completions.length,
        badges,
        certificates: certificates.map((c) => ({
          certificateId: c.certificateId,
          title: c.title,
          category: c.category,
          issueDate: c.issueDate,
          issuer: c.issuer,
        })),
        recentActivity: completions.slice(0, 8).map((c) => ({
          title: c.resource?.title || 'Technical Publication',
          category: c.category,
          completedAt: c.completedAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Download official SubSync completion certificate as PDF
// @route   GET /api/passport/certificate/:certId/download
// @access  Public
export const downloadCertificatePdf = async (req, res, next) => {
  try {
    const certId = req.params.certId;
    const cert = await Certificate.findOne({
      $or: [{ certificateId: certId }, { _id: certId.match(/^[0-9a-fA-F]{24}$/) ? certId : null }],
    });

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate record not found.' });
    }

    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margin: 40,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${cert.certificateId}.pdf"`);

    doc.pipe(res);

    // Decorative background & border
    doc.rect(20, 20, 802, 555).lineWidth(3).stroke('#6C4CF1');
    doc.rect(26, 26, 790, 543).lineWidth(1).stroke('#DDD6FE');

    // Header Branding
    doc.fontSize(16).fillColor('#6C4CF1').text('SUBSYNC ACADEMY & RESEARCH LABS', 60, 60, {
      align: 'center',
      characterSpacing: 2,
    });

    doc.moveDown(0.5);
    doc.fontSize(28).fillColor('#172033').font('Helvetica-Bold').text('CERTIFICATE OF COMPLETION', {
      align: 'center',
    });

    doc.moveDown(0.3);
    doc.fontSize(12).fillColor('#64748B').font('Helvetica').text('This credential certifies that', {
      align: 'center',
    });

    doc.moveDown(0.8);
    doc.fontSize(32).fillColor('#6C4CF1').font('Helvetica-Bold').text(cert.recipientName, {
      align: 'center',
    });

    doc.moveDown(0.6);
    doc.fontSize(13).fillColor('#334155').font('Helvetica').text(
      `has successfully demonstrated proficiency and completed verified publications in`,
      { align: 'center' }
    );

    doc.moveDown(0.4);
    doc.fontSize(20).fillColor('#0F172A').font('Helvetica-Bold').text(cert.title, {
      align: 'center',
    });

    doc.moveDown(0.3);
    doc.fontSize(12).fillColor('#64748B').font('Helvetica').text(`Specialization: ${cert.category}`, {
      align: 'center',
    });

    // Verification Footer
    doc.fontSize(10).fillColor('#94A3B8').text(
      `Certificate ID: ${cert.certificateId}   •   Issued: ${new Date(cert.issueDate).toLocaleDateString()}   •   Verified by SubSync Platform`,
      60,
      490,
      { align: 'center' }
    );

    doc.fontSize(9).fillColor('#CBD5E1').text(
      `SubSync Independent Learning Certification   •   Verify authenticity at subsync.app/verify`,
      60,
      515,
      { align: 'center' }
    );

    doc.end();
  } catch (err) {
    next(err);
  }
};

