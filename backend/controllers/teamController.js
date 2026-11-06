import crypto from 'crypto';
import TeamGroup from '../models/TeamGroup.js';
import Subscription from '../models/Subscription.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { logActivity } from '../services/activityService.js';

// Seat limits mapping based on plan tier
const PLAN_SEATS = {
  free: 0,
  bronze: 0,
  silver: 2,
  gold: 4,
};

// @desc    Get user's current team/family group or eligibility status
// @route   GET /api/team/my-group
// @access  Private
export const getMyGroup = async (req, res, next) => {
  try {
    const user = req.user;

    // Check if user is owner or member of an active team group
    const group = await TeamGroup.findOne({
      isActive: true,
      $or: [{ owner: user._id }, { 'members.user': user._id }],
    })
      .populate('owner', 'name email avatar memberId')
      .populate('members.user', 'name email avatar memberId')
      .populate('plan', 'name slug tierLevel monthlyPrice');

    // Fetch user's active subscription to determine eligibility
    const subscription = await Subscription.findOne({
      user: user._id,
      status: 'Active',
    }).populate('plan');

    const planSlug = subscription?.plan?.slug || 'free';
    const eligibleSeats = PLAN_SEATS[planSlug] || 0;
    const isEligibleToCreate = eligibleSeats > 0;

    if (!group) {
      return res.status(200).json({
        success: true,
        hasGroup: false,
        isEligibleToCreate,
        eligibleSeats,
        currentPlanName: subscription?.plan?.name || 'Free',
        message: isEligibleToCreate
          ? `Your ${subscription.plan.name} plan includes up to ${eligibleSeats} seats for Family & Team sharing. Create your group below.`
          : 'Family & Team sharing is available on Silver (2 seats) and Gold (4 seats) tiers.',
      });
    }

    const isOwner = group.owner._id.toString() === user._id.toString();
    const currentMember = group.members.find((m) => m.user?._id?.toString() === user._id.toString());
    const userRole = isOwner ? 'owner' : currentMember?.role || 'member';

    const activeMembersCount = group.members.filter((m) => m.status === 'active').length;
    const pendingInvitesCount = group.invitations.filter((i) => i.status === 'pending').length;
    const availableSeats = Math.max(0, group.seatLimit - activeMembersCount);

    res.status(200).json({
      success: true,
      hasGroup: true,
      isOwner,
      userRole,
      group: {
        id: group._id,
        name: group.name,
        seatLimit: group.seatLimit,
        activeMembersCount,
        availableSeats,
        sharedDownloadsCount: group.sharedDownloadsCount,
        owner: group.owner,
        plan: group.plan,
        members: group.members,
        invitations: isOwner || userRole === 'admin' ? group.invitations : [],
        createdAt: group.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new Family & Team group
// @route   POST /api/team/create
// @access  Private
export const createGroup = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a name for your group.' });
    }

    // Check if already in a group
    const existingGroup = await TeamGroup.findOne({
      isActive: true,
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    });

    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member or owner of a Family & Team group.',
      });
    }

    // Check plan eligibility
    const subscription = await Subscription.findOne({
      user: req.user._id,
      status: 'Active',
    }).populate('plan');

    const planSlug = subscription?.plan?.slug || 'free';
    const seatLimit = PLAN_SEATS[planSlug] || 0;

    if (seatLimit <= 0) {
      return res.status(403).json({
        success: false,
        message: 'Your current subscription plan does not include Family & Team seats. Please upgrade to Silver or Gold.',
      });
    }

    const group = await TeamGroup.create({
      name: name.trim(),
      owner: req.user._id,
      plan: subscription.plan._id,
      seatLimit,
      members: [
        {
          user: req.user._id,
          role: 'owner',
          status: 'active',
          joinedAt: new Date(),
        },
      ],
      invitations: [],
    });

    await logActivity({
      userId: req.user._id,
      action: 'TEAM_GROUP_CREATED',
      details: `Created team group "${group.name}" with ${seatLimit} seats.`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      message: `Group "${group.name}" successfully established with ${seatLimit} seats!`,
      group,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Send an email invitation to join group
// @route   POST /api/team/invite
// @access  Private
export const inviteMember = async (req, res, next) => {
  try {
    const { email, role = 'member' } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Recipient email is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    const group = await TeamGroup.findOne({
      isActive: true,
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    }).populate('members.user', 'email');

    if (!group) {
      return res.status(404).json({ success: false, message: 'You do not belong to an active group.' });
    }

    // Check permissions: Owner or Admin only
    const isOwner = group.owner.toString() === req.user._id.toString();
    const currentMember = group.members.find((m) => m.user?._id?.toString() === req.user._id.toString());
    if (!isOwner && currentMember?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only group owners and admins are authorized to send invitations.',
      });
    }

    // Check capacity
    const activeCount = group.members.filter((m) => m.status === 'active').length;
    if (activeCount >= group.seatLimit) {
      return res.status(400).json({
        success: false,
        message: `All ${group.seatLimit} seats are currently filled. Upgrade your plan or remove an existing member to invite more.`,
      });
    }

    // Check if user is already a member
    const alreadyMember = group.members.some((m) => m.user?.email === cleanEmail);
    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'This user is already an active member of your group.',
      });
    }

    // Check if there is an active pending invite
    const pendingInvite = group.invitations.find(
      (i) => i.email === cleanEmail && i.status === 'pending' && new Date(i.expiresAt) > new Date()
    );
    if (pendingInvite) {
      return res.status(400).json({
        success: false,
        message: 'An active invitation is already pending for this email address.',
      });
    }

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    group.invitations.push({
      email: cleanEmail,
      token,
      role: role === 'admin' ? 'admin' : 'member',
      invitedBy: req.user._id,
      invitedAt: new Date(),
      expiresAt,
      status: 'pending',
    });

    await group.save();

    // Notify recipient if registered in SubSync
    const recipientUser = await User.findOne({ email: cleanEmail });
    if (recipientUser) {
      await Notification.create({
        user: recipientUser._id,
        title: 'Team Membership Invitation 👥',
        message: `${req.user.name} invited you to join their SubSync Family & Team group "${group.name}"!`,
        category: 'new_resource',
        actionUrl: `/team/invite/${token}`,
      });
    }

    await logActivity({
      userId: req.user._id,
      action: 'TEAM_INVITE_SENT',
      details: `Invited ${cleanEmail} to team group "${group.name}".`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/team/invite/${token}`;

    res.status(200).json({
      success: true,
      message: `Invitation generated for ${cleanEmail}!`,
      inviteLink,
      expiresAt,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Preview invitation details
// @route   GET /api/team/invite/:token
// @access  Public
export const previewInvitation = async (req, res, next) => {
  try {
    const token = req.params.token;
    const group = await TeamGroup.findOne({ 'invitations.token': token })
      .populate('owner', 'name')
      .populate('plan', 'name tierLevel quotas');

    if (!group) {
      return res.status(404).json({ success: false, message: 'Invitation link is invalid or expired.' });
    }

    const invite = group.invitations.find((i) => i.token === token);
    if (!invite || invite.status !== 'pending' || new Date(invite.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This invitation has expired or has already been accepted/revoked.',
      });
    }

    res.status(200).json({
      success: true,
      invitation: {
        groupName: group.name,
        ownerName: group.owner?.name,
        planName: group.plan?.name,
        role: invite.role,
        email: invite.email,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Accept team invitation
// @route   POST /api/team/accept-invite
// @access  Private
export const acceptInvitation = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Invitation token is required.' });
    }

    const group = await TeamGroup.findOne({ 'invitations.token': token }).populate('plan');
    if (!group) {
      return res.status(404).json({ success: false, message: 'Invitation link not found.' });
    }

    const invite = group.invitations.find((i) => i.token === token);
    if (!invite || invite.status !== 'pending' || new Date(invite.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This invitation is invalid, expired, or has already been used.',
      });
    }

    // Check seat capacity
    const activeMembersCount = group.members.filter((m) => m.status === 'active').length;
    if (activeMembersCount >= group.seatLimit) {
      return res.status(400).json({
        success: false,
        message: 'This group has reached its maximum seat limit.',
      });
    }

    // Check if user is already in another group
    const alreadyInGroup = await TeamGroup.findOne({
      isActive: true,
      _id: { $ne: group._id },
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    });
    if (alreadyInGroup) {
      return res.status(400).json({
        success: false,
        message: 'You already belong to another active group. Leave your current group before joining a new one.',
      });
    }

    // Mark invitation accepted
    invite.status = 'accepted';

    // Add user as member if not already added
    const memberIndex = group.members.findIndex(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (memberIndex === -1) {
      group.members.push({
        user: req.user._id,
        role: invite.role,
        status: 'active',
        joinedAt: new Date(),
      });
    }

    await group.save();

    // Notify group owner
    await Notification.create({
      user: group.owner,
      title: 'New Member Joined Group! 🎉',
      message: `${req.user.name} (${req.user.email}) accepted your invitation and joined "${group.name}".`,
      category: 'new_resource',
      actionUrl: '/team',
    });

    await logActivity({
      userId: req.user._id,
      action: 'TEAM_INVITE_ACCEPTED',
      details: `Joined team group "${group.name}" under role "${invite.role}".`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: `You are now a member of "${group.name}"!`,
      groupName: group.name,
      planName: group.plan?.name,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove member from group
// @route   DELETE /api/team/members/:memberId
// @access  Private
export const removeMember = async (req, res, next) => {
  try {
    const memberUserId = req.params.memberId;

    const group = await TeamGroup.findOne({
      isActive: true,
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    const isOwner = group.owner.toString() === req.user._id.toString();
    const currentMember = group.members.find((m) => m.user?.toString() === req.user._id.toString());

    if (!isOwner && currentMember?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only owners and admins can remove members.' });
    }

    // Prevent removing owner
    if (group.owner.toString() === memberUserId) {
      return res.status(400).json({ success: false, message: 'The group owner cannot be removed.' });
    }

    group.members = group.members.filter((m) => m.user.toString() !== memberUserId);
    await group.save();

    // Notify removed user
    await Notification.create({
      user: memberUserId,
      title: 'Team Membership Updated',
      message: `You have been removed from the group "${group.name}".`,
      category: 'system',
      actionUrl: '/team',
    });

    res.status(200).json({
      success: true,
      message: 'Member removed from group successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Revoke pending invitation
// @route   DELETE /api/team/invites/:inviteId
// @access  Private
export const revokeInvitation = async (req, res, next) => {
  try {
    const inviteId = req.params.inviteId;

    const group = await TeamGroup.findOne({
      isActive: true,
      owner: req.user._id,
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found or unauthorized.' });
    }

    group.invitations = group.invitations.filter((i) => i._id.toString() !== inviteId);
    await group.save();

    res.status(200).json({
      success: true,
      message: 'Invitation revoked successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin: Get all team groups
// @route   GET /api/team/admin/all
// @access  Private/Admin
export const getAllGroupsAdmin = async (req, res, next) => {
  try {
    const groups = await TeamGroup.find()
      .populate('owner', 'name email')
      .populate('plan', 'name')
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: groups.length,
      groups,
    });
  } catch (err) {
    next(err);
  }
};

