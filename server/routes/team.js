const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const TeamMember = require('../models/TeamMember');
const Organization = require('../models/Organization');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { logAudit } = require('../utils/auditLogger');
const { transporter } = require('../utils/mailer');
const { createNotification } = require('../utils/notificationService');

// @desc    Get all team members in the org
// @route   GET /api/team
router.get('/', protect, async (req, res) => {
    try {
        if (!req.user.orgId) return res.json([]);

        const members = await TeamMember.find({ orgId: req.user.orgId })
            .populate('userId', 'fullName email createdAt')
            .sort({ invitedAt: 1 });

        res.json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get pending invites for current user
// @route   GET /api/team/invites/me
router.get('/invites/me', protect, async (req, res) => {
    try {
        const invites = await TeamMember.find({ 
            inviteEmail: req.user.email.toLowerCase(), 
            isAccepted: false 
        }).populate('orgId', 'name');
        res.json(invites);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Accept a team invite (for logged-in users)
// @route   POST /api/team/invites/accept/:inviteId
router.post('/invites/accept/:inviteId', protect, async (req, res) => {
    try {
        const member = await TeamMember.findOne({ 
            _id: req.params.inviteId, 
            inviteEmail: req.user.email.toLowerCase(),
            isAccepted: false 
        });

        if (!member) {
            return res.status(404).json({ message: 'Invitation not found or already accepted' });
        }

        const org = await Organization.findById(member.orgId);

        member.userId = req.user._id;
        member.isAccepted = true;
        member.acceptedAt = new Date();
        member.inviteToken = null;
        await member.save();

        // Switch user's active org and role
        const user = await User.findById(req.user._id);
        user.orgId = member.orgId;
        user.companyName = org?.name || user.companyName;
        // Note: The role is derived from TeamMember in protect middleware, 
        // but we sync it here for legacy support/ease of use.
        await user.save();

        // Mark related notifications as read
        await Notification.updateMany(
            { userId: user._id, orgId: member.orgId, type: 'team', isRead: false },
            { isRead: true }
        );

        // Notify Org Owner
        if (org) {
            await createNotification({
                userId: org.ownerId,
                orgId: org._id,
                title: 'New Member Joined',
                message: `${user.fullName} has accepted the invitation and joined your organization.`,
                type: 'success',
                link: '/dashboard/team'
            });
        }

        res.json({ message: 'Invitation accepted', orgId: member.orgId });
    } catch (error) {
        console.error('Accept Invite Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get org info
// @route   GET /api/team/org
router.get('/org', protect, async (req, res) => {
    try {
        if (!req.user.orgId) return res.json(null);
        const org = await Organization.findById(req.user.orgId);
        res.json(org);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Invite a team member via email
// @route   POST /api/team/invite
router.post('/invite', protect, requireRole(['owner', 'admin']), async (req, res) => {
    const { email, role } = req.body;

    if (!email) return res.status(400).json({ message: 'Email is required' });
    if (!['admin', 'member', 'viewer'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Must be admin, member, or viewer.' });
    }

    try {
        if (!req.user.orgId) {
            return res.status(400).json({ message: 'No organization found' });
        }

        // Check if already invited
        const existing = await TeamMember.findOne({
            orgId: req.user.orgId,
            inviteEmail: email.toLowerCase(),
        });
        if (existing) {
            return res.status(409).json({ message: 'This email has already been invited to your team.' });
        }

        const inviteToken = crypto.randomBytes(32).toString('hex');
        const org = await Organization.findById(req.user.orgId);

        const member = await TeamMember.create({
            orgId: req.user.orgId,
            inviteEmail: email.toLowerCase(),
            role,
            inviteToken,
        });

        // Send invite email
        const serverUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        const inviteUrl = `${serverUrl}/api/auth/accept-invite/${inviteToken}`;

        try {
            await transporter.sendMail({
                from: `"PingForge" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: `You've been invited to join ${org.name} on PingForge`,
                html: `
                    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0d0d0d; border-radius: 16px; border: 1px solid #1f1f1f;">
                        <div style="margin-bottom: 24px;">
                            <span style="font-size: 24px; font-weight: 900; color: #fff;">Ping<span style="color: #3b82f6;">Forge</span></span>
                        </div>
                        <h2 style="color: #fff; font-size: 20px; font-weight: 800; margin: 0 0 8px;">You're invited!</h2>
                        <p style="color: #9ca3af; margin: 0 0 24px; line-height: 1.6;">
                            <strong style="color: #fff;">${req.user.fullName}</strong> has invited you to join 
                            <strong style="color: #fff;">${org.name}</strong> on PingForge as a <strong style="color: #3b82f6;">${role}</strong>.
                        </p>
                        <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #6366f1); color: #fff; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 14px;">
                            Accept Invitation →
                        </a>
                        <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">This link expires in 7 days. If you didn't expect this invite, you can safely ignore it.</p>
                    </div>
                `,
            });
        } catch (mailErr) {
            console.error('[Team] Failed to send invite email:', mailErr.message);
        }

        // Create in-app notification if user exists
        const invitedUser = await User.findOne({ email: email.toLowerCase() });
        if (invitedUser) {
            await createNotification({
                userId: invitedUser._id,
                orgId: req.user.orgId,
                title: 'Team Invitation',
                message: `${req.user.fullName} has invited you to join ${org.name} on PingForge.`,
                type: 'team',
                link: '/dashboard/team'
            });
        }

        await logAudit(req, 'invited', 'team', member._id, email);
        res.status(201).json(member);
    } catch (error) {
        console.error('Invite Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Resend invite email
// @route   POST /api/team/:memberId/resend
router.post('/:memberId/resend', protect, requireRole(['owner', 'admin']), async (req, res) => {
    try {
        const member = await TeamMember.findOne({ _id: req.params.memberId, orgId: req.user.orgId, isAccepted: false });
        if (!member) return res.status(404).json({ message: 'Pending invite not found' });

        const newToken = crypto.randomBytes(32).toString('hex');
        member.inviteToken = newToken;
        await member.save();

        const org = await Organization.findById(req.user.orgId);
        const clientUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const inviteUrl = `${clientUrl}/api/auth/accept-invite/${newToken}`;

        await transporter.sendMail({
            from: `"PingForge" <${process.env.EMAIL_USER}>`,
            to: member.inviteEmail,
            subject: `Reminder: You've been invited to ${org.name} on PingForge`,
            html: `<p>Click <a href="${inviteUrl}">here</a> to accept your invitation to ${org.name} on PingForge.</p>`,
        });

        res.json({ message: 'Invite resent successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update a team member's role
// @route   PATCH /api/team/:memberId/role
router.patch('/:memberId/role', protect, requireRole(['owner']), async (req, res) => {
    const { role } = req.body;
    if (!['admin', 'member', 'viewer'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }

    try {
        const member = await TeamMember.findOne({ _id: req.params.memberId, orgId: req.user.orgId });
        if (!member) return res.status(404).json({ message: 'Member not found' });
        if (member.role === 'owner') return res.status(400).json({ message: 'Cannot change the owner role' });

        const oldRole = member.role;
        member.role = role;
        await member.save();

        await logAudit(req, 'role_changed', 'team', member._id, member.inviteEmail, [
            { field: 'role', oldValue: oldRole, newValue: role },
        ]);

        res.json(member);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Remove a team member
// @route   DELETE /api/team/:memberId
router.delete('/:memberId', protect, requireRole(['owner']), async (req, res) => {
    try {
        const member = await TeamMember.findOne({ _id: req.params.memberId, orgId: req.user.orgId });
        if (!member) return res.status(404).json({ message: 'Member not found' });
        if (member.role === 'owner') return res.status(400).json({ message: 'Cannot remove the owner' });

        await member.deleteOne();
        await logAudit(req, 'removed', 'team', member._id, member.inviteEmail);
        res.json({ message: 'Member removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
