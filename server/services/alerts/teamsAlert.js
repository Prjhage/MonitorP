const axios = require('axios');
const { decrypt } = require('../../utils/crypto');
const { formatAlert } = require('./alertFormatter');

const sendTeamsAlert = async (channel, monitor, incident, type) => {
    const formatted = formatAlert(monitor, incident, type);
    const decryptedUrl = decrypt(channel.webhookUrl);

    if (!decryptedUrl.startsWith('http')) return; // Invalid URL

    const payload = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": formatted.color.replace('#', ''),
        "summary": formatted.title,
        "sections": [{
            "activityTitle": type === 'down' ? "🚨 Service Down Alert" : "✅ Service Recovered",
            "activitySubtitle": `PingForge Monitoring — ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
            "facts": formatted.fields.map(f => ({
                "name": f.name,
                "value": f.value
            })),
            "markdown": true
        }],
        "potentialAction": [{
            "@type": "OpenUri",
            "name": "View in PingForge",
            "targets": [{
                "os": "default",
                "uri": `https://pingforge.com/dashboard/monitors/${monitor._id || monitor.id}`
            }]
        }]
    };

    await axios.post(decryptedUrl, payload, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
    });
};

module.exports = { sendTeamsAlert };
