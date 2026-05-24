/**
 * auditLogger.js
 * Centralized helper to create AuditLog entries after successful operations.
 * Usage: await logAudit(req, 'created', 'api', doc._id, doc.name);
 */
const AuditLog = require('../models/AuditLog');

/**
 * @param {Request} req - Express request (must have req.user set by protect middleware)
 * @param {string} action - e.g. 'created', 'updated', 'deleted', 'paused', 'resumed'
 * @param {string} resourceType - e.g. 'api', 'ssl', 'tcp', 'dns', 'heartbeat'
 * @param {ObjectId|string} resourceId
 * @param {string} resourceName
 * @param {Array} changes - optional [{field, oldValue, newValue}]
 */
const logAudit = async (req, action, resourceType, resourceId, resourceName, changes = []) => {
    try {
        const ipAddress =
            req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.socket?.remoteAddress ||
            null;

        await AuditLog.create({
            orgId: req.user?.orgId || null,
            userId: req.user?._id || null,
            userEmail: req.user?.email || 'system',
            userFullName: req.user?.fullName || 'System',
            action,
            resourceType,
            resourceId: resourceId || null,
            resourceName: resourceName || '',
            changes,
            ipAddress,
            timestamp: new Date(),
        });
    } catch (err) {
        // Never let audit logging break a real operation
        console.error('[AuditLog] Failed to write audit entry:', err.message);
    }
};

module.exports = { logAudit };
