const express = require('express');
const router = express.Router();
const API = require('../models/API');
const PingLog = require('../models/PingLog');
const Incident = require('../models/Incident');
const REGIONS = require('../config/regions');
const { protect } = require('../middleware/auth');

// @desc    Get all active APIs for logged in user
// @route   GET /api/apis
router.get('/', protect, async (req, res) => {
    try {
        const apis = await API.find({ userId: req.user._id });
        res.json(apis);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create new API to monitor
// @route   POST /api/apis
router.post('/', protect, async (req, res) => {
    const { name, url, method, expectedStatus, interval, timeout, alertEmail, headers, queryParams, body, assertions } = req.body;

    try {
        const api = await API.create({
            userId: req.user._id,
            name,
            url,
            method,
            expectedStatus,
            interval,
            timeout,
            alertEmail,
            headers: headers || [],
            queryParams: queryParams || [],
            body: body || '',
            assertions: assertions || [],
        });

        res.status(201).json(api);
    } catch (error) {
        console.error('API Create Error:', error);
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update API config (name, url, method, headers, body, assertions, etc.)
// @route   PATCH /api/apis/:id
router.patch('/:id', protect, async (req, res) => {
    try {
        const api = await API.findById(req.params.id);
        if (!api || api.userId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'API not found' });
        }

        const allowedFields = ['name', 'url', 'method', 'expectedStatus', 'interval', 'timeout', 'alertEmail', 'headers', 'queryParams', 'body', 'assertions'];
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

// @desc    Get API stats (uptime, logs, incidents)
// @route   GET /api/apis/:id/stats
router.get('/:id/stats', protect, async (req, res) => {
    try {
        const api = await API.findById(req.params.id);
        if (!api || api.userId.toString() !== req.user._id.toString()) {
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

// @desc    Get regional performance stats
// @route   GET /api/apis/:id/regional-stats
router.get('/:id/regional-stats', protect, async (req, res) => {
    try {
        const api = await API.findById(req.params.id);
        if (!api || api.userId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'API not found' });
        }

        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

        // Aggregate average latency + uptime per region
        const aggregate = await PingLog.aggregate([
            {
                $match: {
                    apiId: api._id,
                    checkedAt: { $gte: fortyEightHoursAgo }
                }
            },
            {
                $group: {
                    _id: '$region',
                    avgResponseTime: { $avg: '$responseTime' },
                    totalPings: { $sum: 1 },
                    upPings: {
                        $sum: { $cond: [{ $eq: ['$status', 'UP'] }, 1, 0] }
                    },
                }
            }
        ]);

        // Merge with region metadata
        const regionalStats = REGIONS.map(region => {
            const data = aggregate.find(a => a._id === region.id);
            const uptime = data ? (data.upPings / data.totalPings) * 100 : 100;
            return {
                ...region,
                avgResponseTime: data ? Math.round(data.avgResponseTime) : null,
                uptime: Math.round(uptime * 10) / 10,
                totalPings: data?.totalPings || 0,
            };
        });

        res.json(regionalStats);
    } catch (error) {
        console.error('Regional Stats Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all incidents for current user
// @route   GET /api/apis/incidents/all
router.get('/incidents/all', protect, async (req, res) => {
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

// @desc    Toggle API active status (Pause/Resume)
// @route   PATCH /api/apis/:id/toggle
router.patch('/:id/toggle', protect, async (req, res) => {
    try {
        const api = await API.findById(req.params.id);
        if (!api || api.userId.toString() !== req.user._id.toString()) {
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
router.delete('/:id', protect, async (req, res) => {
    try {
        const api = await API.findById(req.params.id);
        if (!api || api.userId.toString() !== req.user._id.toString()) {
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
