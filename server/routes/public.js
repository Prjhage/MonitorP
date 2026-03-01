const express = require('express');
const router = express.Router();
const User = require('../models/User');
const API = require('../models/API');
const PingLog = require('../models/PingLog');
const Incident = require('../models/Incident');

// @desc    Get public status for a company (enhanced with 30-day calendar)
// @route   GET /api/public/status/:companyName
router.get('/status/:companyName', async (req, res) => {
    try {
        const user = await User.findOne({ companyName: req.params.companyName });
        if (!user) {
            return res.status(404).json({ message: 'Company not found' });
        }

        const apis = await API.find({ userId: user._id, isActive: true })
            .select('name url status lastChecked');

        const activeIncidents = await Incident.find({
            userId: user._id,
            status: 'OPEN'
        }).populate('apiId', 'name');

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentIncidents = await Incident.find({
            userId: user._id,
            status: 'RESOLVED',
            endTime: { $gte: sevenDaysAgo }
        }).populate('apiId', 'name').sort({ endTime: -1 });

        // --- Build 30-day uptime calendar per API ---
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const uptimeCalendar = {};

        for (const api of apis) {
            // Aggregate pings by day for primary region
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
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$checkedAt' }
                        },
                        totalPings: { $sum: 1 },
                        upPings: {
                            $sum: { $cond: [{ $eq: ['$status', 'UP'] }, 1, 0] }
                        },
                        avgResponseTime: { $avg: '$responseTime' }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            // Build a full 30-day array (fill missing days as null)
            const calendarMap = {};
            for (const day of dailyStats) {
                calendarMap[day._id] = {
                    uptime: Math.round((day.upPings / day.totalPings) * 1000) / 10,
                    avgResponseTime: Math.round(day.avgResponseTime),
                };
            }

            const calendar = [];
            for (let i = 29; i >= 0; i--) {
                const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
                const dateStr = date.toISOString().split('T')[0];
                calendar.push({
                    date: dateStr,
                    uptime: calendarMap[dateStr]?.uptime ?? null,
                    avgResponseTime: calendarMap[dateStr]?.avgResponseTime ?? null,
                });
            }

            uptimeCalendar[api._id.toString()] = calendar;
        }

        // Overall system health (average uptime across all APIs for last 24h)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        let totalUp = 0, totalPings = 0;
        for (const api of apis) {
            const logs = await PingLog.find({
                apiId: api._id,
                region: 'us-east',
                checkedAt: { $gte: twentyFourHoursAgo }
            }).select('status');
            totalPings += logs.length;
            totalUp += logs.filter(l => l.status === 'UP').length;
        }
        const overallHealth = totalPings > 0 ? Math.round((totalUp / totalPings) * 1000) / 10 : 100;

        res.json({
            companyName: user.companyName,
            apis,
            activeIncidents,
            recentIncidents,
            uptimeCalendar,
            overallHealth,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
