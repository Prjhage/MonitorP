const express = require('express');
const router = express.Router();
const DnsMonitor = require('../models/DnsMonitor');
const DnsCheckLog = require('../models/DnsCheckLog');
const { protect } = require('../middleware/auth');
const { requireMinRole } = require('../middleware/rbac');
const { getOrgFilter, getOrgFields, canModify } = require('../utils/orgFilter');
const { logAudit } = require('../utils/auditLogger');
const { processDnsMonitor, resolveDomain } = require('../engine/dnsEngine');

// @desc    Get all DNS monitors for the org
// @route   GET /api/dns
router.get('/', protect, requireMinRole('viewer'), async (req, res) => {
    try {
        const monitors = await DnsMonitor.find(getOrgFilter(req)).sort({ createdAt: -1 }).lean();
        
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

// @desc    Create new DNS monitor
// @route   POST /api/dns
router.post('/', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const { name, domain, recordTypes, checkInterval, alertEmail, alertChannels } = req.body;
        if (!name || !domain) return res.status(400).json({ message: 'Name and domain are required' });

        const cleanDomain = domain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim().toLowerCase();

        const monitor = await DnsMonitor.create({
            ...getOrgFields(req),
            name,
            domain:        cleanDomain,
            recordTypes:   recordTypes   || ['A'],
            checkInterval: checkInterval || 15,
            alertEmail:    alertEmail    || '',
            alertChannels: alertChannels || [],
        });

        processDnsMonitor(monitor, null).catch(err =>
            console.error(`[DNS] Initial check failed for ${cleanDomain}:`, err.message)
        );

        await logAudit(req, 'created', 'dns', monitor._id, monitor.name);
        res.status(201).json(monitor);
    } catch (err) {
        console.error('DNS Create Error:', err);
        res.status(400).json({ message: err.message });
    }
});

// @desc    Get single DNS monitor with live records
// @route   GET /api/dns/:id
router.get('/:id', protect, requireMinRole('viewer'), async (req, res) => {
    try {
        const monitor = await DnsMonitor.findById(req.params.id);
        if (!monitor || !canModify(monitor, req)) return res.status(404).json({ message: 'DNS monitor not found' });

        let currentRecords = null;
        try { currentRecords = await resolveDomain(monitor.domain, monitor.recordTypes); } catch {}

        res.json({ monitor, currentRecords });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Get check logs
// @route   GET /api/dns/:id/logs
router.get('/:id/logs', protect, requireMinRole('viewer'), async (req, res) => {
    try {
        const monitor = await DnsMonitor.findById(req.params.id);
        if (!monitor || !canModify(monitor, req)) return res.status(404).json({ message: 'DNS monitor not found' });

        const limit = parseInt(req.query.limit) || 50;
        const logs = await DnsCheckLog.find({ dnsMonitorId: monitor._id }).sort({ checkedAt: -1 }).limit(limit);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Force rebaseline
// @route   POST /api/dns/:id/rebaseline
router.post('/:id/rebaseline', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const monitor = await DnsMonitor.findById(req.params.id);
        if (!monitor || !canModify(monitor, req)) return res.status(404).json({ message: 'DNS monitor not found' });

        const newRecords = await resolveDomain(monitor.domain, monitor.recordTypes);
        monitor.baseline = { ...newRecords, capturedAt: new Date() };
        monitor.status = 'ok';
        monitor.lastCheckedAt = new Date();
        await monitor.save();

        await DnsCheckLog.create({
            dnsMonitorId: monitor._id,
            status:       'ok',
            records:      newRecords,
            changes:      [],
            reason:       'Baseline manually updated by user',
        });

        await logAudit(req, 'updated', 'dns', monitor._id, monitor.name, [{ field: 'baseline', oldValue: 'previous', newValue: 'rebaselined' }]);
        res.json({ message: 'Baseline updated successfully', monitor });
    } catch (err) {
        console.error('DNS Rebaseline Error:', err);
        res.status(500).json({ message: err.message });
    }
});

// @desc    Update DNS monitor settings
// @route   PATCH /api/dns/:id
router.patch('/:id', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const monitor = await DnsMonitor.findById(req.params.id);
        if (!monitor || !canModify(monitor, req)) return res.status(404).json({ message: 'DNS monitor not found' });

        const allowed = ['name', 'recordTypes', 'checkInterval', 'alertEmail', 'alertChannels'];
        const changes = [];
        for (const field of allowed) {
            if (req.body[field] !== undefined) {
                changes.push({ field, oldValue: monitor[field], newValue: req.body[field] });
                monitor[field] = req.body[field];
            }
        }
        await monitor.save();
        await logAudit(req, 'updated', 'dns', monitor._id, monitor.name, changes);
        res.json(monitor);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @desc    Toggle active/paused
// @route   PATCH /api/dns/:id/toggle
router.patch('/:id/toggle', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const monitor = await DnsMonitor.findById(req.params.id);
        if (!monitor || !canModify(monitor, req)) return res.status(404).json({ message: 'DNS monitor not found' });
        monitor.isActive = !monitor.isActive;
        if (!monitor.isActive) monitor.status = 'pending';
        await monitor.save();
        await logAudit(req, monitor.isActive ? 'resumed' : 'paused', 'dns', monitor._id, monitor.name);
        res.json(monitor);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Delete DNS monitor and all logs
// @route   DELETE /api/dns/:id
router.delete('/:id', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const monitor = await DnsMonitor.findById(req.params.id);
        if (!monitor || !canModify(monitor, req)) return res.status(404).json({ message: 'DNS monitor not found' });
        await DnsCheckLog.deleteMany({ dnsMonitorId: req.params.id });
        await monitor.deleteOne();
        await logAudit(req, 'deleted', 'dns', monitor._id, monitor.name);
        res.json({ message: 'DNS monitor and logs deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
