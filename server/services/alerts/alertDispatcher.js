const AlertChannel = require('../../models/AlertChannel');
const AlertLog = require('../../models/AlertLog');
const { sendSlackAlert } = require('./slackAlert');
const { sendDiscordAlert } = require('./discordAlert');
const { sendTeamsAlert } = require('./teamsAlert');
const { sendWebhookAlert } = require('./webhookAlert');
const { sendEmailAlert } = require('./emailAlert');

const dispatchAlerts = async (monitor, incident, type) => {
    console.log(`[Alert] dispatchAlerts called — monitor: ${monitor.name}, type: ${type}`);
    console.log(`[Alert] alertEmail: ${monitor.alertEmail || 'none'}`);
    console.log(`[Alert] alertChannels: ${JSON.stringify(monitor.alertChannels)}`);

    // Step 1: Always send email (existing behavior)
    if (monitor.alertEmail) {
        try {
            await sendEmailAlert(monitor, incident, type);
            console.log(`[Alert] Email sent to ${monitor.alertEmail}`);
        } catch (err) {
            console.error(`[Alert] Email failed:`, err.message);
        }
    }

    // Step 2: Send to all assigned alert channels
    if (!monitor.alertChannels || monitor.alertChannels.length === 0) {
        console.log(`[Alert] No alert channels assigned to this monitor. Skipping.`);
        return;
    }

    try {
        const channels = await AlertChannel.find({
            _id: { $in: monitor.alertChannels },
            isActive: true
        });

        console.log(`[Alert] Found ${channels.length} active channel(s) to notify.`);

        for (const channel of channels) {
            let success = true;
            let errorMessage = null;
            console.log(`[Alert] Sending to channel: ${channel.name} (${channel.type})`);

            try {
                if (channel.type === 'slack') await sendSlackAlert(channel, monitor, incident, type);
                else if (channel.type === 'discord') await sendDiscordAlert(channel, monitor, incident, type);
                else if (channel.type === 'teams') await sendTeamsAlert(channel, monitor, incident, type);
                else if (channel.type === 'webhook') await sendWebhookAlert(channel, monitor, incident, type);
                console.log(`[Alert] ✓ Successfully sent to ${channel.name}`);
            } catch (err) {
                success = false;
                errorMessage = err.response?.data?.message || err.message;
                console.error(`[Alert] ✗ Alert failed for channel ${channel.name}:`, errorMessage);
            }

            // Log every attempt regardless of success or failure
            await AlertLog.create({
                alertChannelId: channel._id,
                monitorId: monitor._id || monitor.id,
                monitorType: monitor.monitorType || 'api',
                incidentId: incident._id || incident.id || null,
                type,
                status: success ? 'sent' : 'failed',
                errorMessage,
                sentAt: new Date()
            });
        }
    } catch (err) {
        console.error('[Alert] Error dispatching alerts to channels:', err.message);
    }
};

module.exports = { dispatchAlerts };
