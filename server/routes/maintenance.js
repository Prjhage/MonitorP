const express = require('express');
const router = express.Router();
const MaintenanceWindow = require('../models/MaintenanceWindow');
const { protect } = require('../middleware/auth');
const { requireMinRole } = require('../middleware/rbac');
const { logAudit } = require('../utils/auditLogger');

// @desc    Get all maintenance windows for the org
// @route   GET /api/maintenance
router.get('/', protect, requireMinRole('viewer'), async (req, res) => {
    try {
        const filter = req.user.orgId
            ? { orgId: req.user.orgId }
            : { userId: req.user._id };

        const windows = await MaintenanceWindow.find(filter).sort({ startTime: -1 });
        res.json(windows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get currently active maintenance windows (used by engines)
// @route   GET /api/maintenance/active
router.get('/active', protect, requireMinRole('viewer'), async (req, res) => {
    try {
        const now = new Date();
        const filter = {
            isActive: true,
            startTime: { $lte: now },
            endTime: { $gte: now },
            ...(req.user.orgId ? { orgId: req.user.orgId } : { userId: req.user._id }),
        };

        const windows = await MaintenanceWindow.find(filter);
        res.json(windows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a maintenance window
// @route   POST /api/maintenance
router.post('/', protect, requireMinRole('admin'), async (req, res) => {
    const { name, startTime, endTime, isRecurring, cronExpression, timezone, affectedMonitors } = req.body;

    if (!name || !startTime || !endTime) {
        return res.status(400).json({ message: 'Name, startTime, and endTime are required' });
    }

    if (new Date(endTime) <= new Date(startTime)) {
        return res.status(400).json({ message: 'endTime must be after startTime' });
    }

    try {
        const win = await MaintenanceWindow.create({
            orgId: req.user.orgId || null,
            userId: req.user._id,
            name,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            isRecurring: !!isRecurring,
            cronExpression: cronExpression || null,
            timezone: timezone || 'UTC',
            affectedMonitors: affectedMonitors || 'all',
            isActive: true,
        });

        await logAudit(req, 'created', 'maintenance', win._id, win.name);
        res.status(201).json(win);
    } catch (error) {
        console.error('Maintenance Create Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update a maintenance window
// @route   PATCH /api/maintenance/:id
router.patch('/:id', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const win = await MaintenanceWindow.findById(req.params.id);
        if (!win) return res.status(404).json({ message: 'Maintenance window not found' });

        const allowed = req.user.orgId
            ? win.orgId?.toString() === req.user.orgId.toString()
            : win.userId.toString() === req.user._id.toString();
        if (!allowed) return res.status(403).json({ message: 'Not authorized' });

        const fields = ['name', 'startTime', 'endTime', 'isRecurring', 'cronExpression', 'timezone', 'affectedMonitors', 'isActive'];
        const changes = [];
        for (const f of fields) {
            if (req.body[f] !== undefined && String(win[f]) !== String(req.body[f])) {
                changes.push({ field: f, oldValue: win[f], newValue: req.body[f] });
                win[f] = req.body[f];
            }
        }
        await win.save();
        await logAudit(req, 'updated', 'maintenance', win._id, win.name, changes);
        res.json(win);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a maintenance window
// @route   DELETE /api/maintenance/:id
router.delete('/:id', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const win = await MaintenanceWindow.findById(req.params.id);
        if (!win) return res.status(404).json({ message: 'Maintenance window not found' });

        const allowed = req.user.orgId
            ? win.orgId?.toString() === req.user.orgId.toString()
            : win.userId.toString() === req.user._id.toString();
        if (!allowed) return res.status(403).json({ message: 'Not authorized' });

        await win.deleteOne();
        await logAudit(req, 'deleted', 'maintenance', win._id, win.name);
        res.json({ message: 'Maintenance window deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
