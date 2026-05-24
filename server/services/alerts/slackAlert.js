const axios = require('axios');
const { decrypt } = require('../../utils/crypto');
const { formatAlert } = require('./alertFormatter');

const sendSlackAlert = async (channel, monitor, incident, type) => {
    const formatted = formatAlert(monitor, incident, type);
    const decryptedUrl = decrypt(channel.webhookUrl);

    if (!decryptedUrl.startsWith('http')) return; // Invalid URL

    const payload = {
        text: formatted.title,
        attachments: [{
            color: type === 'down' ? 'danger' : 'good',
            fields: formatted.fields.map(f => ({
                title: f.name,
                value: f.value,
                short: f.inline !== false
            })),
            footer: 'PingForge Monitoring',
            footer_icon: 'https://pingforge.com/favicon.ico',
            ts: Math.floor(Date.now() / 1000)
        }]
    };

    await axios.post(decryptedUrl, payload, { timeout: 10000 });
};

module.exports = { sendSlackAlert };
