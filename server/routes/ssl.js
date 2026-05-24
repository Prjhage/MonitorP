const express = require('express');
const router = express.Router();
const SslMonitor = require('../models/SslMonitor');
const { protect } = require('../middleware/auth');
const { requireMinRole } = require('../middleware/rbac');
const { getOrgFilter, getOrgFields, canModify } = require('../utils/orgFilter');
const { logAudit } = require('../utils/auditLogger');
const { processSslMonitor } = require('../engine/sslEngine');

// @desc    Get all SSL monitors for the org
// @route   GET /api/ssl
router.get('/', protect, requireMinRole('viewer'), async (req, res) => {
    try {
        const monitors = await SslMonitor.find(getOrgFilter(req)).sort({ createdAt: -1 }).lean();
        
        // Maintenance suppression check
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

        const monitorsWithMaintenance = monitors.map(m => ({
            ...m,
            inMaintenance: isOrgWide || affectedIds.has(m._id.toString())
        }));

        res.json(monitorsWithMaintenance);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Create new SSL monitor (triggers immediate first check)
// @route   POST /api/ssl
router.post('/', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const { name, domain, alertEmail, alertChannels } = req.body;

        const cleanDomain = domain
            .replace(/^https?:\/\//i, '')
            .replace(/\/.*$/, '')
            .trim();

        if (!cleanDomain) return res.status(400).json({ message: 'Invalid domain provided' });

        const monitor = await SslMonitor.create({
            ...getOrgFields(req),
            name,
            domain: cleanDomain,
            alertEmail: alertEmail || '',
            alertChannels: alertChannels || [],
        });

        processSslMonitor(monitor, null).catch(err =>
            console.error(`[SSL] Initial check failed for ${cleanDomain}:`, err.message)
        );

        await logAudit(req, 'created', 'ssl', monitor._id, monitor.name);
        res.status(201).json(monitor);
    } catch (err) {
        console.error('SSL Create Error:', err);
        res.status(400).json({ message: err.message });
    }
});

// @desc    Get single SSL monitor
// @route   GET /api/ssl/:id
router.get('/:id', protect, requireMinRole('viewer'), async (req, res) => {
    try {
        const monitor = await SslMonitor.findById(req.params.id);
        if (!monitor || !canModify(monitor, req)) {
            return res.status(404).json({ message: 'SSL monitor not found' });
        }
        res.json(monitor);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Trigger a manual re-check
// @route   POST /api/ssl/:id/recheck
router.post('/:id/recheck', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const monitor = await SslMonitor.findById(req.params.id);
        if (!monitor || !canModify(monitor, req)) {
            return res.status(404).json({ message: 'SSL monitor not found' });
        }
        await processSslMonitor(monitor, null);
        const updated = await SslMonitor.findById(req.params.id);
        res.json(updated);
    } catch (err) {
        console.error('SSL Recheck Error:', err);
        res.status(500).json({ message: err.message });
    }
});

// @desc    Toggle active/paused
// @route   PATCH /api/ssl/:id/toggle
router.patch('/:id/toggle', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const monitor = await SslMonitor.findById(req.params.id);
        if (!monitor || !canModify(monitor, req)) {
            return res.status(404).json({ message: 'SSL monitor not found' });
        }
        monitor.isActive = !monitor.isActive;
        await monitor.save();
        await logAudit(req, monitor.isActive ? 'resumed' : 'paused', 'ssl', monitor._id, monitor.name);
        res.json(monitor);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Delete SSL monitor
// @route   DELETE /api/ssl/:id
router.delete('/:id', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const monitor = await SslMonitor.findById(req.params.id);
        if (!monitor || !canModify(monitor, req)) {
            return res.status(404).json({ message: 'SSL monitor not found' });
        }
        await monitor.deleteOne();
        await logAudit(req, 'deleted', 'ssl', monitor._id, monitor.name);
        res.json({ message: 'SSL monitor deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
