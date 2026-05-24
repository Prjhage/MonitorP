const mailer = require('../../utils/mailer');
const User = require('../../models/User');

const sendEmailAlert = async (monitor, incident, type) => {
    try {
        const user = typeof monitor.userId === 'object' && monitor.userId && monitor.userId.fullName ? monitor.userId : await User.findById(monitor.userId);
        if (!user) return;

        const isDown = type === 'down';
        const monitorType = monitor.monitorType || 'api'; // Default to api

        if (monitorType === 'api') {
            if (isDown) await mailer.sendAlertEmail(user, monitor, incident);
            else await mailer.sendRecoveryEmail(user, monitor, incident);
        } else if (monitorType === 'tcp') {
            if (isDown) await mailer.sendTcpDownAlert(user, monitor, incident.reason);
            else await mailer.sendTcpRecoveryAlert(user, monitor, incident.duration || null);
        } else if (monitorType === 'dns') {
            if (isDown) await mailer.sendDnsFailureAlert(user, monitor, incident.reason);
            else await mailer.sendDnsChangeAlert(user, monitor, incident.changes || [], incident.currentRecords || {});
        } else if (monitorType === 'ssl') {
            if (incident.reason === 'expired') {
                await mailer.sendSslExpiredAlert(user, monitor);
            } else {
                await mailer.sendSslExpiryWarning(user, monitor, incident.daysRemaining);
            }
        } else if (monitorType === 'domain') {
           await mailer.sendDomainExpiryAlert(user, monitor, incident.daysRemaining, incident.alertLevel);
        } else if (monitorType === 'heartbeat') {
            if (isDown) await mailer.sendHeartbeatAlertEmail(user, monitor, incident);
            else await mailer.sendHeartbeatRecoveryEmail(user, monitor, incident);
        }
    } catch (err) {
        console.error('Failed to send email alert:', err.message);
    }
};

module.exports = { sendEmailAlert };
