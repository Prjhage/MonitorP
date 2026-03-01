const express = require('express');
const router = express.Router();
const Heartbeat = require('../models/Heartbeat');
const HeartbeatPing = require('../models/HeartbeatPing');
const HeartbeatIncident = require('../models/HeartbeatIncident');
const { sendHeartbeatRecoveryEmail } = require('../utils/mailer');

// @desc    Receive heartbeat ping
// @route   GET /ping/:slug
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const heartbeat = await Heartbeat.findOne({ slug, isActive: true });

        if (!heartbeat) {
            return res.status(404).json({ status: 'error', message: 'Invalid slug' });
        }

        const now = new Date();
        const oldStatus = heartbeat.status;

        // Calculate next expected ping
        const nextExpectedAt = new Date(now);
        if (heartbeat.expectedEveryUnit === 'minutes') {
            nextExpectedAt.setMinutes(now.getMinutes() + heartbeat.expectedEvery);
        } else if (heartbeat.expectedEveryUnit === 'hours') {
            nextExpectedAt.setHours(now.getHours() + heartbeat.expectedEvery);
        } else if (heartbeat.expectedEveryUnit === 'days') {
            nextExpectedAt.setDate(now.getDate() + heartbeat.expectedEvery);
        }

        // Update heartbeat status
        heartbeat.status = 'UP';
        heartbeat.lastPingAt = now;
        heartbeat.nextExpectedAt = nextExpectedAt;
        await heartbeat.save();

        // Check for open incidents to resolve
        const openIncident = await HeartbeatIncident.findOne({
            heartbeatId: heartbeat._id,
            status: 'OPEN'
        });

        if (openIncident) {
            openIncident.status = 'RESOLVED';
            openIncident.resolvedAt = now;
            openIncident.duration = Math.round((now - openIncident.detectedAt) / 60000);
            await openIncident.save();

            // Send recovery email
            const User = require('../models/User');
            const user = await User.findById(heartbeat.userId);
            if (user) {
                await sendHeartbeatRecoveryEmail(user, heartbeat, openIncident);
            }
        }

        // Log the ping
        await HeartbeatPing.create({
            heartbeatId: heartbeat._id,
            receivedAt: now,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.json({
            status: 'success',
            message: 'Heartbeat received',
            nextExpectedAt
        });

    } catch (error) {
        console.error('Ping Receiver Error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
