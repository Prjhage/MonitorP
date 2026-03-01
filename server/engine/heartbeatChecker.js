const cron = require('node-cron');
const Heartbeat = require('../models/Heartbeat');
const HeartbeatIncident = require('../models/HeartbeatIncident');
const User = require('../models/User');
const { sendHeartbeatAlertEmail } = require('../utils/mailer');

const startHeartbeatChecker = (io) => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        console.log('🔍 Checking heartbeats for misses...');
        try {
            const now = new Date();

            // Find heartbeats that are active, not DOWN, and overdue
            const overdue = await Heartbeat.find({
                isActive: true,
                status: { $ne: 'DOWN' },
                nextExpectedAt: { $ne: null }
            });

            for (const heartbeat of overdue) {
                // Deadline = nextExpectedAt + gracePeriod
                const deadline = new Date(heartbeat.nextExpectedAt);
                deadline.setMinutes(deadline.getMinutes() + (heartbeat.gracePeriod || 30));

                if (now > deadline) {
                    console.log(`🚨 Heartbeat overdue: ${heartbeat.name}`);

                    // Create incident
                    const incident = await HeartbeatIncident.create({
                        heartbeatId: heartbeat._id,
                        userId: heartbeat.userId,
                        status: 'OPEN',
                        missedAt: heartbeat.nextExpectedAt,
                        detectedAt: now,
                        alertSent: true
                    });

                    // Update heartbeat status
                    heartbeat.status = 'DOWN';
                    await heartbeat.save();

                    // Send Alert Email
                    const user = await User.findById(heartbeat.userId);
                    if (user) {
                        await sendHeartbeatAlertEmail(user, heartbeat, incident);
                    }

                    // Socket update
                    if (io) {
                        io.emit('heartbeat-update', {
                            heartbeatId: heartbeat._id,
                            status: 'DOWN'
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Heartbeat Checker Error:', error);
        }
    });
};

module.exports = { startHeartbeatChecker };
