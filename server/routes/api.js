const express = require('express');
const router = express.Router();
const API = require('../models/API');
const PingLog = require('../models/PingLog');
const Incident = require('../models/Incident');
const REGIONS = require('../config/regions');
const { protect } = require('../middleware/auth');
const { getOrgFilter, getOrgFields, canModify } = require('../utils/orgFilter');
const { logAudit } = require('../utils/auditLogger');
const { requireMinRole } = require('../middleware/rbac');

// @desc    Test route to verify apiRoutes are reachable
// @route   GET /api/apis/test-ping
router.get('/test-ping', (req, res) => {
    res.json({ message: 'API Routes are reachable', timestamp: new Date() });
});

// @desc    Diagnostic route to check API existence
// @route   GET /api/apis/diag/:id
router.get('/diag/:id', async (req, res) => {
    try {
        const api = await API.findById(req.params.id).lean();
        res.json({
            found: !!api,
            id: req.params.id,
            api: api ? { name: api.name, userId: api.userId } : null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// @desc    Get all active APIs for logged in user
// @route   GET /api/apis
router.get('/', protect, requireMinRole('viewer'), async (req, res) => {
    try {
        const apis = await API.find(getOrgFilter(req)).lean();
        
        // Fetch active maintenance windows for this org/user
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

        const apisWithMaintenance = apis.map(api => ({
            ...api,
            inMaintenance: isOrgWide || affectedIds.has(api._id.toString())
        }));

        res.json(apisWithMaintenance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create new API to monitor
// @route   POST /api/apis
router.post('/', protect, requireMinRole('admin'), async (req, res) => {
    const { name, url, method, expectedStatus, interval, timeout, alertEmail, alertChannels, headers, queryParams, body, assertions } = req.body;

    try {
        const api = await API.create({
            ...getOrgFields(req),
            name,
            url,
            method,
            expectedStatus,
            interval,
            timeout,
            alertEmail,
            alertChannels: alertChannels || [],
            headers: headers || [],
            queryParams: queryParams || [],
            body: body || '',
            assertions: assertions || [],
        });

        await logAudit(req, 'created', 'api', api._id, api.name);
        res.status(201).json(api);
    } catch (error) {
        console.error('API Create Error:', error);
        res.status(400).json({ message: error.message });
    }
});

// @desc    Get all incidents for current user
// @route   GET /api/apis/incidents/all
// NOTE: This MUST be before any /:id routes to avoid Express treating "incidents" as an id
router.get('/incidents/all', protect, requireMinRole('viewer'), async (req, res) => {
    try {
        const incidents = await Incident.find({ userId: req.user._id })
            .populate('apiId', 'name')
            .sort({ startTime: -1 });
        res.json(incidents);
    } catch (error) {
        console.error('All Incidents Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update API config (name, url, method, headers, body, assertions, etc.)
// @route   PATCH /api/apis/:id
router.patch('/:id', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const api = await API.findById(req.params.id);
        if (!api || !canModify(api, req)) {
            return res.status(404).json({ message: 'API not found' });
        }

        const allowedFields = ['name', 'url', 'method', 'expectedStatus', 'interval', 'timeout', 'alertEmail', 'alertChannels', 'headers', 'queryParams', 'body', 'assertions'];
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                api[field] = req.body[field];
            }
        }

        await api.save();
        res.json(api);
    } catch (error) {
        console.error('API Update Error:', error);
        res.status(400).json({ message: error.message });
    }
});

// @desc    Get advanced performance analytics (P50, P95, P99, Error Rate, Throughput, Apdex)
// @route   GET /api/apis/:id/advanced-stats
router.get('/:id/advanced-stats', protect, requireMinRole('viewer'), async (req, res) => {
    console.log(`[DEBUG] Advanced Stats requested for ID: ${req.params.id}`);
    try {
        const api = await API.findById(req.params.id).lean();
        if (!api || !canModify(api, req)) {
            console.log(`[DEBUG] API not found or mismatch: ${req.params.id}`);
            return res.status(404).json({ message: 'API not found' });
        }

        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        // Fetch all logs from the last 24h
        const logs = await PingLog.find({
            apiId: api._id,
            checkedAt: { $gte: twentyFourHoursAgo }
        }).sort({ checkedAt: 1 }).lean();

        if (logs.length === 0) {
            return res.json({
                p50: 0, p95: 0, p99: 0,
                errorRate: 0,
                throughput: 0,
                apdex: 1,
                totalRequests: 0,
                status: 'no_data'
            });
        }

        const latencies = logs
            .map(l => l.responseTime)
            .filter(t => t !== null && t !== undefined)
            .sort((a, b) => a - b);

        const calculatePercentile = (arr, p) => {
            if (arr.length === 0) return 0;
            const index = Math.ceil((p / 100) * arr.length) - 1;
            return arr[index];
        };

        const p50 = calculatePercentile(latencies, 50);
        const p95 = calculatePercentile(latencies, 95);
        const p99 = calculatePercentile(latencies, 99);

        // Error Rate
        const totalPings = logs.length;
        const failedPings = logs.filter(l => l.status === 'DOWN').length;
        const errorRate = (failedPings / totalPings) * 100;

        // Throughput (Requests per minute/second)
        // Since we check at intervals, throughput is basically (checks / time_range)
        // Let's use Requests Per Hour or minute if it's too low for RPS
        const throughput = totalPings / 24; // Avg requests per hour

        // Apdex Score
        // T = 500ms (threshold)
        // Satisfied: responseTime <= T
        // Tolerating: T < responseTime <= 4T
        // Frustrated: responseTime > 4T
        const T = 500;
        let satisfied = 0;
        let tolerating = 0;
        
        logs.forEach(l => {
            if (l.status === 'UP') {
                if (l.responseTime <= T) {
                    satisfied++;
                } else if (l.responseTime <= 4 * T) {
                    tolerating++;
                }
            }
        });

        const apdex = (satisfied + (tolerating / 2)) / totalPings;

        res.json({
            p50,
            p95,
            p99,
            errorRate: parseFloat(errorRate.toFixed(2)),
            throughput: parseFloat(throughput.toFixed(2)),
            apdex: parseFloat(apdex.toFixed(2)),
            totalRequests: totalPings,
            status: 'success'
        });

    } catch (error) {
        console.error('Advanced Stats Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get API stats (uptime, logs, incidents)
// @route   GET /api/apis/:id/stats
router.get('/:id/stats', protect, requireMinRole('viewer'), async (req, res) => {
    try {
        const api = await API.findById(req.params.id);
        if (!api || !canModify(api, req)) {
            return res.status(404).json({ message: 'API not found' });
        }

        // Get recent logs (primary region only for the chart)
        const logs = await PingLog.find({ apiId: api._id, region: 'us-east' })
            .sort({ checkedAt: -1 })
            .limit(100);

        const incidents = await Incident.find({ apiId: api._id }).sort({ startTime: -1 });

        // Calculate uptime % (last 24h, primary region)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentLogs = await PingLog.find({
            apiId: api._id,
            region: 'us-east',
            checkedAt: { $gte: twentyFourHoursAgo }
        });

        const totalPings = recentLogs.length;
        const upPings = recentLogs.filter(log => log.status === 'UP').length;
        const uptime = totalPings > 0 ? (upPings / totalPings) * 100 : 100;

        // Get latest assertion results
        const latestLog = logs[0];

        res.json({
            api,
            uptime,
            logs,
            incidents,
            latestAssertionResults: latestLog?.assertionResults || [],
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Toggle API active status (Pause/Resume)
// @route   PATCH /api/apis/:id/toggle
router.patch('/:id/toggle', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const api = await API.findById(req.params.id);
        if (!api || !canModify(api, req)) {
            return res.status(404).json({ message: 'API not found' });
        }

        api.isActive = !api.isActive;
        if (!api.isActive) {
            api.status = 'PENDING';
        }
        await api.save();

        res.json(api);
    } catch (error) {
        console.error('Toggle API Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete API
// @route   DELETE /api/apis/:id
router.delete('/:id', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const api = await API.findById(req.params.id);
        if (!api || !canModify(api, req)) {
            return res.status(404).json({ message: 'API not found' });
        }

        await api.deleteOne();
        await PingLog.deleteMany({ apiId: req.params.id });
        await Incident.deleteMany({ apiId: req.params.id });

        res.json({ message: 'API and associated data removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
