const express = require('express');
const router = express.Router();
const User = require('../models/User');
const API = require('../models/API');
const PingLog = require('../models/PingLog');
const Incident = require('../models/Incident');
const Heartbeat = require('../models/Heartbeat');
const HeartbeatIncident = require('../models/HeartbeatIncident');
const SslMonitor = require('../models/SslMonitor');

// @desc    Get public status for a company (enhanced with Heartbeat & SSL)
// @route   GET /api/public/status/:companyName
router.get('/status/:companyName', async (req, res) => {
    try {
        const user = await User.findOne({ companyName: req.params.companyName });
        if (!user) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // 1. Fetch all monitor types
        const apis = await API.find({ userId: user._id, isActive: true })
            .select('name url status lastChecked');

        const heartbeats = await Heartbeat.find({ userId: user._id, isActive: true })
            .select('name status lastPingAt nextExpectedAt');

        const sslMonitors = await SslMonitor.find({ userId: user._id, isActive: true })
            .select('name domain status daysRemaining validTo');

        // 2. Fetch all active incidents
        const activeApiIncidents = await Incident.find({
            userId: user._id,
            status: 'OPEN'
        }).populate('apiId', 'name');

        const activeHbIncidents = await HeartbeatIncident.find({
            userId: user._id,
            status: 'OPEN'
        }).populate('heartbeatId', 'name');

        const recentIncidents = await Incident.find({
            userId: user._id,
            status: 'RESOLVED',
            endTime: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }).populate('apiId', 'name').sort({ endTime: -1 }).limit(10);

        // 3. Build 30-day uptime calendar per API
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const uptimeCalendar = {};

        for (const api of apis) {
            const dailyStats = await PingLog.aggregate([
                {
                    $match: {
                        apiId: api._id,
                        region: 'us-east',
                        checkedAt: { $gte: thirtyDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$checkedAt' } },
                        totalPings: { $sum: 1 },
                        upPings: { $sum: { $cond: [{ $eq: ['$status', 'UP'] }, 1, 0] } }
                    }
                }
            ]);

            const calendarMap = {};
            for (const day of dailyStats) {
                calendarMap[day._id] = Math.round((day.upPings / day.totalPings) * 1000) / 10;
            }

            const calendar = [];
            for (let i = 29; i >= 0; i--) {
                const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
                const dateStr = date.toISOString().split('T')[0];
                calendar.push({
                    date: dateStr,
                    uptime: calendarMap[dateStr] ?? null
                });
            }
            uptimeCalendar[api._id.toString()] = calendar;
        }

        // 4. Calculate Unified Overall Health (weighted across all categories)
        const totalMonitors = apis.length + heartbeats.length + sslMonitors.length;
        const upMonitors = 
            apis.filter(a => a.status === 'UP').length +
            heartbeats.filter(h => h.status === 'UP').length +
            sslMonitors.filter(s => s.status === 'VALID').length;

        const overallHealth = totalMonitors > 0 
            ? Math.round((upMonitors / totalMonitors) * 1000) / 10 
            : 100;

        res.json({
            companyName: user.companyName,
            apis,
            heartbeats,
            sslMonitors,
            activeIncidents: [...activeApiIncidents, ...activeHbIncidents],
            recentIncidents,
            uptimeCalendar,
            overallHealth,
        });
    } catch (error) {
        console.error('Status Page Error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
