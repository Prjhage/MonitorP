const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Organization = require('../models/Organization');
const TeamMember = require('../models/TeamMember');
const Notification = require('../models/Notification');
const { createNotification } = require('../utils/notificationService');

const generateToken = (id, orgId, role) => {
    return jwt.sign({ id, orgId, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const API = require('../models/API');
const Heartbeat = require('../models/Heartbeat');
const SSL = require('../models/SslMonitor');
const TCP = require('../models/TcpMonitor');
const DNS = require('../models/DnsMonitor');
const Domain = require('../models/DomainMonitor');


/**
 * Ensure a user has an org. Called on register AND on login for legacy users.
 * Returns { orgId, role }
 */
const ensureOrg = async (user) => {
    // User already has an org
    if (user.orgId) {
        const member = await TeamMember.findOne({ userId: user._id, orgId: user.orgId });
        
        // MIGRATION: Even if they have an org, they might have legacy monitors
        // This ensures old data shows up for the team.
        await Promise.all([
            API.updateMany({ userId: user._id, orgId: { $exists: false } }, { orgId: user.orgId }),
            Heartbeat.updateMany({ userId: user._id, orgId: { $exists: false } }, { orgId: user.orgId }),
            SSL.updateMany({ userId: user._id, orgId: { $exists: false } }, { orgId: user.orgId }),
            TCP.updateMany({ userId: user._id, orgId: { $exists: false } }, { orgId: user.orgId }),
            DNS.updateMany({ userId: user._id, orgId: { $exists: false } }, { orgId: user.orgId }),
            Domain.updateMany({ userId: user._id, orgId: { $exists: false } }, { orgId: user.orgId }),
        ]);

        return {
            orgId: user.orgId,
            role: member?.role || 'owner',
        };
    }

    // No org yet — create one (new user or legacy user first login)
    const org = await Organization.create({
        name: user.companyName || `${user.fullName}'s Team`,
        ownerId: user._id,
    });

    // Create owner TeamMember record
    await TeamMember.create({
        orgId: org._id,
        userId: user._id,
        inviteEmail: user.email,
        role: 'owner',
        isAccepted: true,
        acceptedAt: new Date(),
    });

    // Save orgId on user
    user.orgId = org._id;
    await user.save();

    // MIGRATION: Update all user's legacy monitors to this org
    await Promise.all([
        API.updateMany({ userId: user._id, orgId: { $exists: false } }, { orgId: org._id }),
        Heartbeat.updateMany({ userId: user._id, orgId: { $exists: false } }, { orgId: org._id }),
        SSL.updateMany({ userId: user._id, orgId: { $exists: false } }, { orgId: org._id }),
        TCP.updateMany({ userId: user._id, orgId: { $exists: false } }, { orgId: org._id }),
        DNS.updateMany({ userId: user._id, orgId: { $exists: false } }, { orgId: org._id }),
        Domain.updateMany({ userId: user._id, orgId: { $exists: false } }, { orgId: org._id }),
    ]);

    return { orgId: org._id, role: 'owner' };
};

// @desc    Register a new user
// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
    const { fullName, companyName, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ fullName, companyName, email, password });

        if (user) {
            const { orgId, role } = await ensureOrg(user);
            res.status(201).json({
                _id: user._id,
                fullName: user.fullName,
                companyName: user.companyName,
                email: user.email,
                orgId,
                role,
                token: generateToken(user._id, orgId, role),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            const { orgId, role } = await ensureOrg(user);
            res.json({
                _id: user._id,
                fullName: user.fullName,
                companyName: user.companyName,
                email: user.email,
                orgId,
                role,
                token: generateToken(user._id, orgId, role),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Accept a team invite
// @route   GET /api/auth/accept-invite/:token
router.get('/accept-invite/:token', async (req, res) => {
    try {
        const member = await TeamMember.findOne({ inviteToken: req.params.token, isAccepted: false });
        if (!member) {
            return res.status(404).json({ message: 'Invite not found or already accepted' });
        }

        const org = await Organization.findById(member.orgId);
        // Redirect to register page with orgToken pre-filled
        const clientUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(
            `${clientUrl}/register?inviteToken=${req.params.token}&email=${encodeURIComponent(member.inviteEmail)}&orgName=${encodeURIComponent(org?.name || '')}`
        );
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Complete invite registration (called after filling the register form with inviteToken)
// @route   POST /api/auth/complete-invite
router.post('/complete-invite', async (req, res) => {
    const { inviteToken, fullName, password } = req.body;

    try {
        const member = await TeamMember.findOne({ inviteToken, isAccepted: false });
        if (!member) {
            return res.status(404).json({ message: 'Invite not found or already used' });
        }

        // Check if user already exists (re-invite case)
        let user = await User.findOne({ email: member.inviteEmail });
        if (!user) {
            const org = await Organization.findById(member.orgId);
            user = await User.create({
                fullName,
                email: member.inviteEmail,
                companyName: org?.name || '',
                password,
                orgId: member.orgId,
            });
        } else {
            // Existing user joining a new org
            user.orgId = member.orgId;
            await user.save();
        }

        // Finalize membership
        member.userId = user._id;
        member.isAccepted = true;
        member.acceptedAt = new Date();
        member.inviteToken = null;
        await member.save();

        // Mark related notifications as read
        await Notification.updateMany(
            { userId: user._id, orgId: member.orgId, type: 'team', isRead: false },
            { isRead: true }
        );

        // Notify Org Owner
        const org = await Organization.findById(member.orgId);
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

        res.status(201).json({
            _id: user._id,
            fullName: user.fullName,
            companyName: user.companyName,
            email: user.email,
            orgId: member.orgId,
            role: member.role,
            token: generateToken(user._id, member.orgId, member.role),
        });
    } catch (error) {
        console.error('Complete Invite Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
router.get('/me', require('../middleware/auth').protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // On-the-fly migration for legacy users
        const { orgId, role } = await ensureOrg(user);

        res.json({
            _id: user._id,
            fullName: user.fullName,
            companyName: user.companyName,
            email: user.email,
            orgId,
            role,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
router.put('/profile', require('../middleware/auth').protect, async (req, res) => {
    const { fullName, companyName, email } = req.body;

    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // If email is changing, check if new email is taken
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            const oldEmail = user.email;
            user.email = email;

            // If user updated their email, check if there are pending invites for the NEW email
            // and create notifications for them so the user sees them in the UI.
            const pendingInvites = await TeamMember.find({ inviteEmail: email.toLowerCase(), isAccepted: false });
            for (const invite of pendingInvites) {
                const org = await Organization.findById(invite.orgId);
                await createNotification({
                    userId: user._id,
                    orgId: invite.orgId,
                    title: 'Team Invitation',
                    message: `You have a pending invitation to join ${org?.name || 'an organization'} on PingForge.`,
                    type: 'team',
                    link: '/dashboard/profile'
                });
            }
        }

        if (fullName) user.fullName = fullName;
        
        if (companyName && companyName !== user.companyName) {
            user.companyName = companyName;
            
            // If user is the owner of their current org, update the org name too
            const member = await TeamMember.findOne({ userId: user._id, orgId: user.orgId });
            if (member && member.role === 'owner') {
                await Organization.findByIdAndUpdate(user.orgId, { name: companyName });
            }
        }

        await user.save();

        res.json({
            _id: user._id,
            fullName: user.fullName,
            companyName: user.companyName,
            email: user.email,
            orgId: user.orgId,
            role: req.user.role // Role from the token/session
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
