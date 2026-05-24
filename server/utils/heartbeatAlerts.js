const HeartbeatIncident = require('../models/HeartbeatIncident');
const User = require('../models/User');
const { dispatchAlerts } = require('../services/alerts/alertDispatcher');

/**
 * Triggers a heartbeat alert, creates an incident, updates status, and sends notifications.
 * @param {Object} heartbeat - The Heartbeat document
 * @param {Date} now - Current date
 * @param {String} type - MISSED, TIMEOUT, or FAIL
 * @param {String} message - Human readable error message
 * @param {Object} io - Socket.io instance (optional)
 */
const triggerHeartbeatAlert = async (heartbeat, now, type, message, io) => {
    console.log(`🚨 Heartbeat Alert [${type}]: ${heartbeat.name} - ${message}`);

    // Create incident
    const incident = await HeartbeatIncident.create({
        heartbeatId: heartbeat._id,
        userId: heartbeat.userId,
        status: 'OPEN',
        type: type,
        detectedAt: now,
        message,
        alertSent: true
    });

    // Update heartbeat status
    heartbeat.status = 'DOWN';
    await heartbeat.save();

    // Send Alert
    try {
        const user = await User.findById(heartbeat.userId);
        if (user) {
            const monitorData = { ...heartbeat.toObject(), monitorType: 'heartbeat' };
            await dispatchAlerts(monitorData, incident, 'down');
        }
    } catch (err) {
        console.error('Failed to dispatch heartbeat alert:', err);
    }

    // Socket update
    if (io) {
        io.emit('heartbeat-update', {
            heartbeatId: heartbeat._id,
            status: 'DOWN',
            message,
            incidentType: type
        });
    }

    return incident;
};

module.exports = { triggerHeartbeatAlert };
