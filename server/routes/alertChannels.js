const express = require('express');
const router = express.Router();
const AlertChannel = require('../models/AlertChannel');
const AlertLog = require('../models/AlertLog');
const { protect } = require('../middleware/auth');
const { requireMinRole } = require('../middleware/rbac');
const { getOrgFilter, getOrgFields, canModify } = require('../utils/orgFilter');
const { logAudit } = require('../utils/auditLogger');
const { encrypt } = require('../utils/crypto');

const { sendSlackAlert }   = require('../services/alerts/slackAlert');
const { sendDiscordAlert } = require('../services/alerts/discordAlert');
const { sendTeamsAlert }   = require('../services/alerts/teamsAlert');
const { sendWebhookAlert } = require('../services/alerts/webhookAlert');

// @desc    Create new alert channel
// @route   POST /api/alert-channels
router.post('/', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const { name, type, webhookUrl, webhookConfig } = req.body;
        if (!name || !type || !webhookUrl) return res.status(400).json({ message: 'Missing required fields' });

        const channel = await AlertChannel.create({
            ...getOrgFields(req),
            name,
            type,
            webhookUrl: encrypt(webhookUrl),
            webhookConfig,
        });

        await logAudit(req, 'created', 'alertchannel', channel._id, `${name} (${type})`);
        res.status(201).json(channel);
    } catch (error) {
        console.error('Create Alert Channel Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    List all channels for the org
// @route   GET /api/alert-channels
router.get('/', protect, async (req, res) => {
    try {
        const channels = await AlertChannel.find(getOrgFilter(req)).sort({ createdAt: -1 });
        res.json(channels);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get single channel
// @route   GET /api/alert-channels/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const channel = await AlertChannel.findById(req.params.id);
        if (!channel || !canModify(channel, req)) return res.status(404).json({ message: 'Channel not found' });
        res.json(channel);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update channel
// @route   PATCH /api/alert-channels/:id
router.patch('/:id', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const { name, webhookUrl, isActive, webhookConfig } = req.body;
        const channel = await AlertChannel.findById(req.params.id);
        if (!channel || !canModify(channel, req)) return res.status(404).json({ message: 'Channel not found' });

        const changes = [];
        if (name && name !== channel.name)              { changes.push({ field: 'name', oldValue: channel.name, newValue: name }); channel.name = name; }
        if (webhookUrl)                                  { channel.webhookUrl = encrypt(webhookUrl); }
        if (isActive !== undefined && isActive !== channel.isActive) { changes.push({ field: 'isActive', oldValue: channel.isActive, newValue: isActive }); channel.isActive = isActive; }
        if (webhookConfig)                               { channel.webhookConfig = webhookConfig; }

        await channel.save();
        await logAudit(req, 'updated', 'alertchannel', channel._id, channel.name, changes);
        res.json(channel);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete channel
// @route   DELETE /api/alert-channels/:id
router.delete('/:id', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const channel = await AlertChannel.findById(req.params.id);
        if (!channel || !canModify(channel, req)) return res.status(404).json({ message: 'Channel not found' });
        await channel.deleteOne();
        await logAudit(req, 'deleted', 'alertchannel', channel._id, channel.name);
        res.json({ message: 'Channel deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Send test message to webhook
// @route   POST /api/alert-channels/:id/test
router.post('/:id/test', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const channel = await AlertChannel.findById(req.params.id);
        if (!channel || !canModify(channel, req)) return res.status(404).json({ message: 'Channel not found' });

        const fakeMonitor = { _id: 'test_id', name: 'Test Monitor — Health Check', url: 'https://api.yourcompany.com/health', monitorType: 'api' };
        const fakeIncident = { _id: 'test_incident', reason: 'This is a test alert from PingForge', startedAt: new Date(), duration: 0 };

        if (channel.type === 'slack')   await sendSlackAlert(channel, fakeMonitor, fakeIncident, 'down');
        if (channel.type === 'discord') await sendDiscordAlert(channel, fakeMonitor, fakeIncident, 'down');
        if (channel.type === 'teams')   await sendTeamsAlert(channel, fakeMonitor, fakeIncident, 'down');
        if (channel.type === 'webhook') await sendWebhookAlert(channel, fakeMonitor, fakeIncident, 'down');

        res.json({ success: true, message: 'Test alert sent successfully' });
    } catch (error) {
        console.error('Test Alert Error:', error.message);
        res.status(400).json({ success: false, message: `Failed: ${error.message}` });
    }
});

// @desc    Get alert logs for a specific monitor
// @route   GET /api/alert-channels/monitor/:monitorId
router.get('/monitor/:monitorId', protect, async (req, res) => {
    try {
        const logs = await AlertLog.find({ monitorId: req.params.monitorId })
            .populate('alertChannelId', 'name type')
            .sort({ sentAt: -1 })
            .limit(20);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
