const express = require('express');
const router = express.Router();
const DomainMonitor = require('../models/DomainMonitor');
const { protect } = require('../middleware/auth');
const { requireMinRole } = require('../middleware/rbac');
const { getOrgFilter, getOrgFields, canModify } = require('../utils/orgFilter');
const { logAudit } = require('../utils/auditLogger');
const { processDomainMonitor, getDaysRemaining } = require('../engine/domainExpiryEngine');

// @desc    Get all domain monitors — sorted by expiry (most urgent first)
// @route   GET /api/domains
router.get('/', protect, requireMinRole('viewer'), async (req, res) => {
    try {
        const monitors = await DomainMonitor.find(getOrgFilter(req)).lean();
        
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

        monitors.sort((a, b) => {
            const aDate = a.whoisData?.expiryDate;
            const bDate = b.whoisData?.expiryDate;
            if (!aDate && !bDate) return 0;
            if (!aDate) return 1;
            if (!bDate) return -1;
            return new Date(aDate) - new Date(bDate);
        });

        const enriched = monitors.map(m => ({
            ...m,
            daysRemaining: getDaysRemaining(m.whoisData?.expiryDate),
            inMaintenance: isOrgWide || affectedIds.has(m._id.toString())
        }));

        res.json(enriched);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Add domain monitor — triggers immediate WHOIS lookup
// @route   POST /api/domains
router.post('/', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const { name, domain, alertEmail, alertChannels } = req.body;
        if (!name || !domain) return res.status(400).json({ message: 'Name and domain are required' });

        const cleanDomain = domain
            .replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim().toLowerCase();

        const monitor = await DomainMonitor.create({
            ...getOrgFields(req),
            name,
            domain: cleanDomain,
            alertEmail: alertEmail || '',
            alertChannels: alertChannels || [],
        });

        processDomainMonitor(monitor).catch(err =>
            console.error(`[DOMAIN] Initial lookup failed for ${cleanDomain}:`, err.message)
        );

        await logAudit(req, 'created', 'domain', monitor._id, monitor.name);
        res.status(201).json(monitor);
    } catch (err) {
        console.error('Domain Create Error:', err);
        res.status(400).json({ message: err.message });
    }
});

// @desc    Get single domain monitor
// @route   GET /api/domains/:id
router.get('/:id', protect, requireMinRole('viewer'), async (req, res) => {
    try {
        const monitor = await DomainMonitor.findById(req.params.id);
        if (!monitor || !canModify(monitor, req)) return res.status(404).json({ message: 'Domain monitor not found' });
        const obj = monitor.toObject();
        obj.daysRemaining = getDaysRemaining(monitor.whoisData?.expiryDate);
        res.json(obj);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Force fresh WHOIS lookup
// @route   POST /api/domains/:id/refresh
router.post('/:id/refresh', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const monitor = await DomainMonitor.findById(req.params.id);
        if (!monitor || !canModify(monitor, req)) return res.status(404).json({ message: 'Domain monitor not found' });
        await processDomainMonitor(monitor);
        const updated = await DomainMonitor.findById(req.params.id);
        const obj = updated.toObject();
        obj.daysRemaining = getDaysRemaining(updated.whoisData?.expiryDate);
        res.json(obj);
    } catch (err) {
        console.error('Domain Refresh Error:', err);
        res.status(500).json({ message: err.message });
    }
});

// @desc    Reset alert flags (after user renews domain)
// @route   PATCH /api/domains/:id/alerts
router.patch('/:id/alerts', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const monitor = await DomainMonitor.findById(req.params.id);
        if (!monitor || !canModify(monitor, req)) return res.status(404).json({ message: 'Domain monitor not found' });
        monitor.alertsSent = { days60: false, days30: false, days15: false, days7: false, days3: false, days1: false, expired: false };
        await monitor.save();
        await logAudit(req, 'updated', 'domain', monitor._id, monitor.name, [{ field: 'alertsSent', oldValue: 'set', newValue: 'reset' }]);
        res.json({ message: 'Alert flags reset', monitor });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Toggle active/paused
// @route   PATCH /api/domains/:id/toggle
router.patch('/:id/toggle', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const monitor = await DomainMonitor.findById(req.params.id);
        if (!monitor || !canModify(monitor, req)) return res.status(404).json({ message: 'Domain monitor not found' });
        monitor.isActive = !monitor.isActive;
        await monitor.save();
        await logAudit(req, monitor.isActive ? 'resumed' : 'paused', 'domain', monitor._id, monitor.name);
        res.json(monitor);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Delete domain monitor
// @route   DELETE /api/domains/:id
router.delete('/:id', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const monitor = await DomainMonitor.findById(req.params.id);
        if (!monitor || !canModify(monitor, req)) return res.status(404).json({ message: 'Domain monitor not found' });
        await monitor.deleteOne();
        await logAudit(req, 'deleted', 'domain', monitor._id, monitor.name);
        res.json({ message: 'Domain monitor deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
