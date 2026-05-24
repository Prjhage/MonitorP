const express = require('express');
const router = express.Router();
const TcpMonitor = require('../models/TcpMonitor');
const TcpPingLog = require('../models/TcpPingLog');
const { protect } = require('../middleware/auth');
const { requireMinRole } = require('../middleware/rbac');
const { getOrgFilter, getOrgFields, canModify } = require('../utils/orgFilter');
const { logAudit } = require('../utils/auditLogger');
const { processTcpMonitor } = require('../engine/tcpEngine');

// @desc    Get all TCP monitors for the org
// @route   GET /api/tcp
router.get('/', protect, requireMinRole('viewer'), async (req, res) => {
    try {
        const monitors = await TcpMonitor.find(getOrgFilter(req)).sort({ createdAt: -1 }).lean();
        
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

// @desc    Create new TCP monitor
// @route   POST /api/tcp
router.post('/', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const { name, host, port, checkInterval, timeout, alertEmail, alertChannels } = req.body;
        if (!name || !host || !port) return res.status(400).json({ message: 'Name, host, and port are required' });

        const portNum = parseInt(port, 10);
        if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
            return res.status(400).json({ message: 'Port must be between 1 and 65535' });
        }

        const cleanHost = host.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();

        const monitor = await TcpMonitor.create({
            ...getOrgFields(req),
            name,
            host: cleanHost,
            port: portNum,
            checkInterval: checkInterval || 5,
            timeout:       timeout       || 10000,
            alertEmail:    alertEmail    || '',
            alertChannels: alertChannels || [],
        });

        processTcpMonitor(monitor, null).catch(err =>
            console.error(`[TCP] Initial check failed for ${cleanHost}:${portNum}:`, err.message)
        );

        await logAudit(req, 'created', 'tcp', monitor._id, monitor.name);
        res.status(201).json(monitor);
    } catch (err) {
        console.error('TCP Create Error:', err);
        res.status(400).json({ message: err.message });
    }
});

// @desc    Get single TCP monitor with stats
// @route   GET /api/tcp/:id
router.get('/:id', protect, requireMinRole('viewer'), async (req, res) => {
    try {
        const monitor = await TcpMonitor.findById(req.params.id);
        if (!monitor || !canModify(monitor, req)) return res.status(404).json({ message: 'TCP monitor not found' });

        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentLogs = await TcpPingLog.find({ tcpMonitorId: monitor._id, checkedAt: { $gte: twentyFourHoursAgo } });

        const totalPings = recentLogs.length;
        const upPings    = recentLogs.filter(l => l.status === 'up').length;
        const uptime     = totalPings > 0 ? ((upPings / totalPings) * 100).toFixed(2) : null;

        const responseTimes = recentLogs.filter(l => l.responseTime !== null).map(l => l.responseTime);
        const avgResponseTime = responseTimes.length > 0
            ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : null;

        res.json({ monitor, uptime, avgResponseTime, totalChecks: totalPings });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Get ping logs
// @route   GET /api/tcp/:id/logs
router.get('/:id/logs', protect, requireMinRole('viewer'), async (req, res) => {
    try {
        const monitor = await TcpMonitor.findById(req.params.id);
        if (!monitor || !canModify(monitor, req)) return res.status(404).json({ message: 'TCP monitor not found' });

        const limit = parseInt(req.query.limit) || 100;
        const logs = await TcpPingLog.find({ tcpMonitorId: monitor._id }).sort({ checkedAt: -1 }).limit(limit);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Get 24h stats
// @route   GET /api/tcp/:id/stats
router.get('/:id/stats', protect, requireMinRole('viewer'), async (req, res) => {
    try {
        const monitor = await TcpMonitor.findById(req.params.id);
        if (!monitor || !canModify(monitor, req)) return res.status(404).json({ message: 'TCP monitor not found' });

        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const logs = await TcpPingLog.find({ tcpMonitorId: monitor._id, checkedAt: { $gte: twentyFourHoursAgo } }).sort({ checkedAt: 1 });
        res.json({ monitor, logs });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Update TCP monitor settings
// @route   PATCH /api/tcp/:id
router.patch('/:id', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const monitor = await TcpMonitor.findById(req.params.id);
        if (!monitor || !canModify(monitor, req)) return res.status(404).json({ message: 'TCP monitor not found' });

        const allowed = ['name', 'host', 'port', 'checkInterval', 'timeout', 'alertEmail', 'alertChannels'];
        const changes = [];
        for (const field of allowed) {
            if (req.body[field] !== undefined && String(monitor[field]) !== String(req.body[field])) {
                changes.push({ field, oldValue: monitor[field], newValue: req.body[field] });
                monitor[field] = req.body[field];
            }
        }
        await monitor.save();
        await logAudit(req, 'updated', 'tcp', monitor._id, monitor.name, changes);
        res.json(monitor);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @desc    Toggle active/paused
// @route   PATCH /api/tcp/:id/toggle
router.patch('/:id/toggle', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const monitor = await TcpMonitor.findById(req.params.id);
        if (!monitor || !canModify(monitor, req)) return res.status(404).json({ message: 'TCP monitor not found' });
        monitor.isActive = !monitor.isActive;
        if (!monitor.isActive) monitor.status = 'pending';
        await monitor.save();
        await logAudit(req, monitor.isActive ? 'resumed' : 'paused', 'tcp', monitor._id, monitor.name);
        res.json(monitor);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Force re-check
// @route   POST /api/tcp/:id/recheck
router.post('/:id/recheck', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const monitor = await TcpMonitor.findById(req.params.id);
        if (!monitor || !canModify(monitor, req)) return res.status(404).json({ message: 'TCP monitor not found' });
        monitor.lastCheckedAt = null;
        await processTcpMonitor(monitor, null);
        const updated = await TcpMonitor.findById(req.params.id);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Delete TCP monitor and all logs
// @route   DELETE /api/tcp/:id
router.delete('/:id', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const monitor = await TcpMonitor.findById(req.params.id);
        if (!monitor || !canModify(monitor, req)) return res.status(404).json({ message: 'TCP monitor not found' });
        await TcpPingLog.deleteMany({ tcpMonitorId: req.params.id });
        await monitor.deleteOne();
        await logAudit(req, 'deleted', 'tcp', monitor._id, monitor.name);
        res.json({ message: 'TCP monitor and logs deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
