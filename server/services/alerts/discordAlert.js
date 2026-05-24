const axios = require('axios');
const { decrypt } = require('../../utils/crypto');
const { formatAlert } = require('./alertFormatter');

const sendDiscordAlert = async (channel, monitor, incident, type) => {
    const formatted = formatAlert(monitor, incident, type);
    const decryptedUrl = decrypt(channel.webhookUrl);

    if (!decryptedUrl.startsWith('http')) return; // Invalid URL

    const payload = {
        content: formatted.title,
        embeds: [{
            title: type === 'down' ? '🔴 Service Down' : '🟢 Service Recovered',
            description: type === 'down'
                ? `**${monitor.name}** is reporting an issue.`
                : `**${monitor.name}** is back online.`,
            color: formatted.colorInt,
            fields: formatted.fields,
            footer: { text: 'PingForge Monitoring' },
            timestamp: formatted.timestamp
        }]
    };

    await axios.post(decryptedUrl, payload, { timeout: 10000 });
};

module.exports = { sendDiscordAlert };
