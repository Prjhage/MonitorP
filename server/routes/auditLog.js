const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');
const { requireMinRole } = require('../middleware/rbac');

// @desc    Get audit logs with filters
// @route   GET /api/audit-log
router.get('/', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const { action, resourceType, userId, from, to, page = 1, limit = 50 } = req.query;

        const filter = {};

        // Scope to org or user
        if (req.user.orgId) {
            filter.orgId = req.user.orgId;
        } else {
            filter.userId = req.user._id;
        }

        if (action)       filter.action       = action;
        if (resourceType) filter.resourceType = resourceType;
        if (userId)       filter.userId       = userId;

        if (from || to) {
            filter.timestamp = {};
            if (from) filter.timestamp.$gte = new Date(from);
            if (to)   filter.timestamp.$lte = new Date(to);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await AuditLog.countDocuments(filter);
        const logs = await AuditLog.find(filter)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        res.json({
            logs,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
        });
    } catch (error) {
        console.error('Audit Log Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Export audit log as CSV
// @route   GET /api/audit-log/export
router.get('/export', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const filter = req.user.orgId
            ? { orgId: req.user.orgId }
            : { userId: req.user._id };

        const logs = await AuditLog.find(filter).sort({ timestamp: -1 }).limit(5000).lean();

        // Manual CSV Generation
        const header = 'timestamp,userEmail,userFullName,action,resourceType,resourceName,ipAddress\n';
        const rows = logs.map(l =>
            [l.timestamp, l.userEmail, l.userFullName, l.action, l.resourceType, l.resourceName, l.ipAddress]
                .map(v => `"${String(v || '').replace(/"/g, '""')}"`)
                .join(',')
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="audit-log.csv"');
        res.send(header + rows);
    } catch (error) {
        console.error('CSV Export Error:', error);
        res.status(500).json({ message: 'Failed to generate CSV' });
    }
});

module.exports = router;
