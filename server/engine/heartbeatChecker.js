const cron = require('node-cron');
const Heartbeat = require('../models/Heartbeat');
const { triggerHeartbeatAlert } = require('../utils/heartbeatAlerts');
const { runWithLimit } = require('../utils/async');
const { isInMaintenance } = require('../utils/maintenanceCheck');

const startHeartbeatChecker = (io) => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        const startTime = Date.now();
        console.log(`[Heartbeat] Starting monitoring cycle at ${new Date().toISOString()}`);

        try {
            const now = new Date();

            // 1. Check for overdue heartbeats
            // Optimization: Only fetch heartbeats whose nextExpectedAt is in the past
            const overdue = await Heartbeat.find({
                isActive: true,
                isPaused: { $ne: true },
                status: { $in: ['UP', 'PENDING'] },
                nextExpectedAt: { $lt: now }
            });

            if (overdue.length > 0) {
                console.log(`[Heartbeat] Found ${overdue.length} potentially overdue heartbeats.`);
                await runWithLimit(20, overdue, async (heartbeat) => {
                    const deadline = new Date(heartbeat.nextExpectedAt);
                    deadline.setMinutes(deadline.getMinutes() + (heartbeat.gracePeriod || 30));

                    if (now > deadline) {
                        const skip = await isInMaintenance(heartbeat._id, heartbeat.orgId, heartbeat.userId);
                        if (skip) {
                            console.log(`[Heartbeat] Maintenance window active — skipping alert for ${heartbeat.name}`);
                            return;
                        }
                        return triggerHeartbeatAlert(
                            heartbeat,
                            now,
                            'MISSED',
                            `Heartbeat missed: last expected at ${heartbeat.nextExpectedAt.toLocaleString()}`,
                            io
                        );
                    }
                });
            }

            // 2. Check for jobs running too long
            const runningTooLong = await Heartbeat.find({
                isActive: true,
                isPaused: { $ne: true },
                status: 'RUNNING',
                currentJobStartedAt: { $ne: null },
                maxDuration: { $ne: null }
            });

            if (runningTooLong.length > 0) {
                console.log(`[Heartbeat] Found ${runningTooLong.length} jobs currently running.`);
                await runWithLimit(20, runningTooLong, async (heartbeat) => {
                    const startTimeHr = new Date(heartbeat.currentJobStartedAt);
                    let maxMs = heartbeat.maxDuration;

                    if (heartbeat.maxDurationUnit === 'minutes') maxMs *= 60000;
                    else if (heartbeat.maxDurationUnit === 'hours') maxMs *= 3600000;
                    else if (heartbeat.maxDurationUnit === 'seconds') maxMs *= 1000;

                    const limitTime = new Date(startTimeHr.getTime() + maxMs);

                    if (now > limitTime) {
                        const diffMins = Math.round((now - startTimeHr) / 60000);
                        const skip = await isInMaintenance(heartbeat._id, heartbeat.orgId, heartbeat.userId);
                        if (skip) {
                            console.log(`[Heartbeat] Maintenance window active — skipping TIMEOUT alert for ${heartbeat.name}`);
                            return;
                        }
                        await triggerHeartbeatAlert(
                            heartbeat,
                            now,
                            'TIMEOUT',
                            `Job running too long: Started at ${startTimeHr.toLocaleTimeString()}, running for ${diffMins} minutes (Max: ${heartbeat.maxDuration} ${heartbeat.maxDurationUnit})`,
                            io
                        );
                        heartbeat.currentJobStartedAt = null;
                        return heartbeat.save();
                    }
                });
            }

            const duration = Date.now() - startTime;
            if (overdue.length > 0 || runningTooLong.length > 0) {
                console.log(`[Heartbeat] Cycle completed in ${duration}ms.`);
            }

        } catch (error) {
            console.error('[Heartbeat] Critical Error in checker:', error);
        }
    });
};

module.exports = { startHeartbeatChecker };
