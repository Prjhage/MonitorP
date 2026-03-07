const express = require('express');
const router = express.Router();
const Heartbeat = require('../models/Heartbeat');
const HeartbeatPing = require('../models/HeartbeatPing');
const HeartbeatIncident = require('../models/HeartbeatIncident');
const { sendHeartbeatRecoveryEmail } = require('../utils/mailer');

const cronParser = require('cron-parser');
const { triggerHeartbeatAlert } = require('../utils/heartbeatAlerts');

// @desc    Receive heartbeat ping
// @route   GET /ping/:slug/:signal?
router.get('/:slug/:signal?', async (req, res) => {
    try {
        const { slug, signal } = req.params;
        const heartbeat = await Heartbeat.findOne({ slug, isActive: true });

        if (!heartbeat) {
            return res.status(404).json({ status: 'error', message: 'Invalid slug' });
        }

        if (heartbeat.isPaused) {
            return res.json({
                status: 'success',
                message: 'Heartbeat signal received, but monitor is currently PAUSED. Resume in dashboard to enable automated checking.'
            });
        }

        const now = new Date();
        const signalType = signal === 'start' ? 'start' : (signal === 'fail' ? 'fail' : 'success');

        let nextExpectedAt = heartbeat.nextExpectedAt;
        let jobDuration = null;

        if (signalType === 'start') {
            heartbeat.status = 'RUNNING';
            heartbeat.currentJobStartedAt = now;
        } else if (signalType === 'fail') {
            // Extract io from app if possible, or pass null
            const io = req.app.get('io');
            await triggerHeartbeatAlert(
                heartbeat,
                now,
                'FAIL',
                'Job explicitly reported failure via /fail signal',
                io
            );
            // After triggering alert, we still want to save the heartbeat (status updated by utility)
        } else {
            // Success Case
            heartbeat.status = 'UP';
            heartbeat.lastPingAt = now;

            // Calculate duration if we have a start time
            if (heartbeat.currentJobStartedAt) {
                jobDuration = now - heartbeat.currentJobStartedAt;
                heartbeat.lastJobDuration = jobDuration;

                // Update average (weighted average or simple moving average)
                if (heartbeat.avgJobDuration === 0) {
                    heartbeat.avgJobDuration = jobDuration;
                } else {
                    heartbeat.avgJobDuration = Math.round((heartbeat.avgJobDuration * 0.8) + (jobDuration * 0.2));
                }
                heartbeat.currentJobStartedAt = null;
            }

            // Calculate next expected ping
            if (heartbeat.scheduleType === 'cron' && heartbeat.cronExpression) {
                try {
                    const interval = cronParser.parseExpression(heartbeat.cronExpression, {
                        tz: heartbeat.timezone || 'UTC'
                    });
                    nextExpectedAt = interval.next().toDate();
                } catch (e) {
                    console.error('Cron parsing error:', e);
                    // Fallback to old logic if cron fails
                }
            } else {
                nextExpectedAt = new Date(now);
                if (heartbeat.expectedEveryUnit === 'minutes') {
                    nextExpectedAt.setMinutes(now.getMinutes() + heartbeat.expectedEvery);
                } else if (heartbeat.expectedEveryUnit === 'hours') {
                    nextExpectedAt.setHours(now.getHours() + heartbeat.expectedEvery);
                } else if (heartbeat.expectedEveryUnit === 'days') {
                    nextExpectedAt.setDate(now.getDate() + heartbeat.expectedEvery);
                }
            }
            heartbeat.nextExpectedAt = nextExpectedAt;

            // Resolve open incidents
            const openIncident = await HeartbeatIncident.findOne({
                heartbeatId: heartbeat._id,
                status: 'OPEN'
            });

            if (openIncident) {
                openIncident.status = 'RESOLVED';
                openIncident.resolvedAt = now;
                openIncident.duration = Math.round((now - openIncident.detectedAt) / 60000);
                await openIncident.save();

                const User = require('../models/User');
                const user = await User.findById(heartbeat.userId);
                if (user) {
                    await sendHeartbeatRecoveryEmail(user, heartbeat, openIncident);
                }
            }
        }

        await heartbeat.save();

        // Log the ping
        await HeartbeatPing.create({
            heartbeatId: heartbeat._id,
            receivedAt: now,
            signalType,
            jobDuration,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.json({
            status: 'success',
            message: `Heartbeat ${signalType} signal received`,
            nextExpectedAt: signalType === 'success' ? nextExpectedAt : undefined,
            jobDuration: jobDuration ? `${jobDuration}ms` : undefined
        });

    } catch (error) {
        console.error('Ping Receiver Error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
