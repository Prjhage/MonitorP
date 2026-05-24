const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const StatusPageSubscriber = require('../models/StatusPageSubscriber');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { transporter } = require('../utils/mailer');

// @desc    Subscribe to a status page (public)
// @route   POST /api/status-subscribers/subscribe
router.post('/subscribe', async (req, res) => {
    const { email, companyName } = req.body;
    if (!email || !companyName) {
        return res.status(400).json({ message: 'Email and companyName are required' });
    }

    try {
        // Find the user/org that owns this status page
        const owner = await User.findOne({ companyName });
        if (!owner) {
            return res.status(404).json({ message: 'Status page not found' });
        }

        // Check if already subscribed
        const existing = await StatusPageSubscriber.findOne({ userId: owner._id, email: email.toLowerCase() });
        if (existing) {
            if (existing.isVerified) {
                return res.status(409).json({ message: 'Already subscribed' });
            }
            // Resend verification
            const clientUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const verifyUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/status-subscribers/verify/${existing.verifyToken}`;
            await sendVerifyEmail(email, companyName, verifyUrl);
            return res.json({ message: 'Verification email resent. Please check your inbox.' });
        }

        const subscriber = await StatusPageSubscriber.create({
            orgId: owner.orgId || null,
            userId: owner._id,
            email: email.toLowerCase(),
        });

        const serverUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        const verifyUrl = `${serverUrl}/api/status-subscribers/verify/${subscriber.verifyToken}`;
        await sendVerifyEmail(email, companyName, verifyUrl);

        res.status(201).json({ message: 'Check your email to confirm your subscription.' });
    } catch (error) {
        console.error('Subscribe Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Verify subscription (double opt-in)
// @route   GET /api/status-subscribers/verify/:token
router.get('/verify/:token', async (req, res) => {
    try {
        const subscriber = await StatusPageSubscriber.findOne({ verifyToken: req.params.token });
        if (!subscriber) {
            return res.status(404).send('<h2>Invalid or expired verification link.</h2>');
        }

        subscriber.isVerified = true;
        await subscriber.save();

        const clientUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const owner = await User.findById(subscriber.userId);
        return res.redirect(`${clientUrl}/status/${owner?.companyName || ''}?subscribed=true`);
    } catch (error) {
        res.status(500).send('<h2>Something went wrong. Please try again.</h2>');
    }
});

// @desc    Unsubscribe
// @route   GET /api/status-subscribers/unsubscribe/:token
router.get('/unsubscribe/:token', async (req, res) => {
    try {
        const subscriber = await StatusPageSubscriber.findOne({ unsubToken: req.params.token });
        if (!subscriber) {
            return res.status(404).send('<h2>Invalid unsubscribe link.</h2>');
        }
        await subscriber.deleteOne();

        const clientUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${clientUrl}/?unsubscribed=true`);
    } catch (error) {
        res.status(500).send('<h2>Something went wrong.</h2>');
    }
});

// @desc    List subscribers for the org (protected)
// @route   GET /api/status-subscribers
router.get('/', protect, async (req, res) => {
    try {
        const filter = req.user.orgId
            ? { orgId: req.user.orgId }
            : { userId: req.user._id };

        const subscribers = await StatusPageSubscriber.find(filter)
            .select('email isVerified subscribedAt')
            .sort({ subscribedAt: -1 });

        res.json(subscribers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a subscriber (protected)
// @route   DELETE /api/status-subscribers/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const sub = await StatusPageSubscriber.findById(req.params.id);
        if (!sub) return res.status(404).json({ message: 'Subscriber not found' });

        const allowed = req.user.orgId
            ? sub.orgId?.toString() === req.user.orgId.toString()
            : sub.userId.toString() === req.user._id.toString();
        if (!allowed) return res.status(403).json({ message: 'Not authorized' });

        await sub.deleteOne();
        res.json({ message: 'Subscriber removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Helper: send verification email
const sendVerifyEmail = async (email, companyName, verifyUrl) => {
    try {
        await transporter.sendMail({
            from: `"PingForge Status" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Confirm your subscription to ${companyName} Status`,
            html: `
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0d0d0d; border-radius: 16px; border: 1px solid #1f1f1f;">
                    <h2 style="color: #fff; font-weight: 800; margin: 0 0 12px;">Confirm Subscription</h2>
                    <p style="color: #9ca3af; margin: 0 0 24px; line-height: 1.6;">
                        You requested to receive status updates for <strong style="color:#fff;">${companyName}</strong>. 
                        Click the button below to confirm.
                    </p>
                    <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #6366f1); color: #fff; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 14px;">
                        Confirm Subscription →
                    </a>
                    <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
                </div>
            `,
        });
    } catch (err) {
        console.error('[StatusSubscriber] Email send failed:', err.message);
    }
};

/**
 * Notify all verified subscribers of a status change.
 * Called by alertDispatcher when a monitor changes status.
 */
const notifySubscribers = async (userId, orgId, monitorName, status, duration = null) => {
    try {
        const filter = orgId ? { orgId, isVerified: true } : { userId, isVerified: true };
        const subscribers = await StatusPageSubscriber.find(filter).select('email unsubToken');
        if (subscribers.length === 0) return;

        const owner = await User.findById(userId);
        const companyName = owner?.companyName || 'Unknown';
        const isDown = status === 'DOWN' || status === 'down';

        const serverUrl = process.env.BACKEND_URL || 'http://localhost:5000';

        for (const sub of subscribers) {
            const unsubUrl = `${serverUrl}/api/status-subscribers/unsubscribe/${sub.unsubToken}`;
            const subject = isDown
                ? `⚠️ ${companyName} Status Update — Incident Detected`
                : `✅ ${companyName} Status Update — Service Recovered`;

            const body = isDown
                ? `<p style="color:#9ca3af;"><strong style="color:#fff;">${monitorName}</strong> is currently experiencing issues. Our team has been notified and is investigating.</p>`
                : `<p style="color:#9ca3af;"><strong style="color:#fff;">${monitorName}</strong> has recovered.${duration ? ` Downtime: <strong style="color:#fff;">${duration} minutes</strong>.` : ''}</p>`;

            await transporter.sendMail({
                from: `"${companyName} Status" <${process.env.EMAIL_USER}>`,
                to: sub.email,
                subject,
                html: `
                    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d0d0d;border-radius:16px;border:1px solid #1f1f1f;">
                        <h2 style="color:${isDown ? '#ef4444' : '#10b981'};font-weight:800;margin:0 0 12px;">${isDown ? '⚠️ Incident Detected' : '✅ Service Recovered'}</h2>
                        ${body}
                        <p style="color:#6b7280;font-size:11px;margin-top:24px;">
                            You're receiving this because you subscribed to ${companyName} status updates.
                            <a href="${unsubUrl}" style="color:#6b7280;">Unsubscribe</a>
                        </p>
                    </div>
                `,
            }).catch(err => console.error('[StatusSubscriber] Notify failed:', err.message));
        }
    } catch (err) {
        console.error('[StatusSubscriber] notifySubscribers error:', err.message);
    }
};

module.exports = router;
module.exports.notifySubscribers = notifySubscribers;
