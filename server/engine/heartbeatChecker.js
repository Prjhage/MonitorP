const cron = require('node-cron');
const Heartbeat = require('../models/Heartbeat');
const HeartbeatIncident = require('../models/HeartbeatIncident');
const User = require('../models/User');
const { triggerHeartbeatAlert } = require('../utils/heartbeatAlerts');

const startHeartbeatChecker = (io) => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        console.log('🔍 Checking heartbeats for misses and timeouts...');
        try {
            const now = new Date();

            // 1. Check for overdue heartbeats
            const overdue = await Heartbeat.find({
                isActive: true,
                isPaused: { $ne: true },
                status: { $in: ['UP', 'PENDING'] },
                nextExpectedAt: { $ne: null }
            });

            for (const heartbeat of overdue) {
                const deadline = new Date(heartbeat.nextExpectedAt);
                deadline.setMinutes(deadline.getMinutes() + (heartbeat.gracePeriod || 30));

                if (now > deadline) {
                    await triggerHeartbeatAlert(
                        heartbeat,
                        now,
                        'MISSED',
                        `Heartbeat missed: last expected at ${heartbeat.nextExpectedAt.toLocaleString()}`,
                        io
                    );
                }
            }

            // 2. Check for jobs running too long
            const runningTooLong = await Heartbeat.find({
                isActive: true,
                isPaused: { $ne: true },
                status: 'RUNNING',
                currentJobStartedAt: { $ne: null },
                maxDuration: { $ne: null }
            });

            for (const heartbeat of runningTooLong) {
                const startTime = new Date(heartbeat.currentJobStartedAt);
                let maxMs = heartbeat.maxDuration;

                if (heartbeat.maxDurationUnit === 'minutes') maxMs *= 60000;
                else if (heartbeat.maxDurationUnit === 'hours') maxMs *= 3600000;
                else if (heartbeat.maxDurationUnit === 'seconds') maxMs *= 1000;

                const limitTime = new Date(startTime.getTime() + maxMs);

                if (now > limitTime) {
                    const diffMins = Math.round((now - startTime) / 60000);
                    await triggerHeartbeatAlert(
                        heartbeat,
                        now,
                        'TIMEOUT',
                        `Job running too long: Started at ${startTime.toLocaleTimeString()}, running for ${diffMins} minutes (Max: ${heartbeat.maxDuration} ${heartbeat.maxDurationUnit})`,
                        io
                    );
                }
            }
        } catch (error) {
            console.error('Heartbeat Checker Error:', error);
        }
    });
};

module.exports = { startHeartbeatChecker };
