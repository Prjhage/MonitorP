const axios = require('axios');
const { decrypt } = require('../../utils/crypto');
const { formatAlert } = require('./alertFormatter');

const sendWebhookAlert = async (channel, monitor, incident, type) => {
    const isDown = type === 'down';
    const formatted = formatAlert(monitor, incident, type);
    const decryptedUrl = decrypt(channel.webhookUrl);

    if (!decryptedUrl.startsWith('http')) return; // Invalid URL

    const payload = {
        source: 'pingforge',
        event: isDown ? 'monitor.down' : 'monitor.recovery',
        timestamp: new Date().toISOString(),
        displayName: formatted.title,
        statusLabel: formatted.status,
        monitor: {
            id: monitor._id || monitor.id,
            name: monitor.name,
            type: monitor.monitorType || 'api',
            url: monitor.url || null,
            host: monitor.host || null,
            port: monitor.port || null,
            status: isDown ? 'down' : 'up'
        },
        incident: {
            id: incident._id || incident.id || null,
            reason: incident.reason || null,
            startedAt: incident.startedAt || new Date(),
            resolvedAt: isDown ? null : new Date(),
            duration: isDown ? null : (incident.duration || 0),
            fields: formatted.fields
        }
    };

    const headers = {
        'Content-Type': 'application/json',
        ...(channel.webhookConfig && channel.webhookConfig.headers ? channel.webhookConfig.headers : {})
    };

    await axios.post(decryptedUrl, payload, { timeout: 10000, headers });
};

module.exports = { sendWebhookAlert };
