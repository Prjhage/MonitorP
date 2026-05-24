const express = require('express');
const router = express.Router();
const Heartbeat = require('../models/Heartbeat');
const HeartbeatPing = require('../models/HeartbeatPing');
const HeartbeatIncident = require('../models/HeartbeatIncident');
const { protect } = require('../middleware/auth');
const { requireMinRole } = require('../middleware/rbac');
const { getOrgFilter, getOrgFields, canModify } = require('../utils/orgFilter');
const { logAudit } = require('../utils/auditLogger');
const { generateSlug } = require('../utils/slug');

// Connectivity test (must be before :id routes)
router.get('/test/connectivity', (req, res) => {
    res.json({ message: 'Heartbeat router is reachable' });
});

// @desc    Toggle heartbeat pause status
// @route   PATCH /api/heartbeats/:id/toggle
router.patch('/:id/toggle', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const heartbeat = await Heartbeat.findById(req.params.id);
        if (!heartbeat || !canModify(heartbeat, req)) {
            return res.status(404).json({ message: 'Heartbeat not found' });
        }
        heartbeat.isPaused = !heartbeat.isPaused;
        await heartbeat.save();
        await logAudit(req, heartbeat.isPaused ? 'paused' : 'resumed', 'heartbeat', heartbeat._id, heartbeat.name);
        res.json(heartbeat);
    } catch (error) {
        console.error('Toggle error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all heartbeats for the org
// @route   GET /api/heartbeats
router.get('/', protect, requireMinRole('viewer'), async (req, res) => {
    try {
        const filter = { ...getOrgFilter(req), isActive: true };
        const heartbeats = await Heartbeat.find(filter).lean();
        
        // Fetch active maintenance windows
        const now = new Date();
        const MaintenanceWindow = require('../models/MaintenanceWindow');
        const windows = await MaintenanceWindow.find({
            isActive: true,
            startTime: { $lte: now },
            endTime: { $gte: now },
            ...(req.user.orgId ? { orgId: req.user.orgId } : { userId: req.user._id })
        }).lean();

        const isOrgWide = windows.some(w => w.affectedMonitors === 'all');
        const affectedIds = new Set();
        if (!isOrgWide) {
            windows.forEach(w => {
                if (Array.isArray(w.affectedMonitors)) {
                    w.affectedMonitors.forEach(id => affectedIds.add(id.toString()));
                }
            });
        }

        const heartbeatsWithMaintenance = heartbeats.map(hb => ({
            ...hb,
            inMaintenance: isOrgWide || affectedIds.has(hb._id.toString())
        }));

        res.json(heartbeatsWithMaintenance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create new heartbeat monitor
// @route   POST /api/heartbeats
router.post('/', protect, requireMinRole('admin'), async (req, res) => {
    const {
        name, expectedEvery, expectedEveryUnit, gracePeriod, alertEmail, alertChannels,
        scheduleType, cronExpression, timezone, maxDuration, maxDurationUnit
    } = req.body;

    try {
        const heartbeat = await Heartbeat.create({
            ...getOrgFields(req),
            name,
            slug: generateSlug(),
            expectedEvery:     expectedEvery     || (scheduleType === 'cron' ? 0 : 24),
            expectedEveryUnit: expectedEveryUnit || 'hours',
            gracePeriod:       gracePeriod       || 30,
            alertEmail:        alertEmail        || req.user.email,
            alertChannels:     alertChannels     || [],
            status:            'PENDING',
            scheduleType:      scheduleType      || 'interval',
            cronExpression,
            timezone,
            maxDuration,
            maxDurationUnit,
        });

        await logAudit(req, 'created', 'heartbeat', heartbeat._id, heartbeat.name);
        res.status(201).json(heartbeat);
    } catch (error) {
        console.error('Create Heartbeat Error:', error);
        res.status(400).json({ message: error.message });
    }
});

// @desc    Get heartbeat stats (last pings, incidents)
// @route   GET /api/heartbeats/:id/stats
router.get('/:id/stats', protect, requireMinRole('viewer'), async (req, res) => {
    try {
        const heartbeat = await Heartbeat.findById(req.params.id);
        if (!heartbeat || !canModify(heartbeat, req)) {
            return res.status(404).json({ message: 'Heartbeat not found' });
        }

        const logs = await HeartbeatPing.find({ heartbeatId: heartbeat._id })
            .sort({ receivedAt: -1 }).limit(50);

        const incidents = await HeartbeatIncident.find({ heartbeatId: heartbeat._id })
            .sort({ detectedAt: -1 });

        res.json({ heartbeat, logs, incidents });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete heartbeat monitor (soft delete)
// @route   DELETE /api/heartbeats/:id
router.delete('/:id', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const heartbeat = await Heartbeat.findById(req.params.id);
        if (!heartbeat || !canModify(heartbeat, req)) {
            return res.status(404).json({ message: 'Heartbeat not found' });
        }
        heartbeat.isActive = false;
        await heartbeat.save();
        await logAudit(req, 'deleted', 'heartbeat', heartbeat._id, heartbeat.name);
        res.json({ message: 'Heartbeat monitor removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
