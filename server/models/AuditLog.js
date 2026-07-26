const mongoose = require('mongoose');

const changeSchema = new mongoose.Schema({
    field: { type: String },
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
}, { _id: false });

const auditLogSchema = new mongoose.Schema({
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        default: null,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    userEmail: {
        type: String,
        default: 'system',
    },
    userFullName: {
        type: String,
        default: 'System',
    },
    action: {
        type: String,
        enum: ['created', 'updated', 'deleted', 'paused', 'resumed', 'invited', 'removed', 'role_changed', 'subscribed', 'login'],
        required: true,
    },
    resourceType: {
        type: String,
        enum: ['api', 'ssl', 'tcp', 'dns', 'heartbeat', 'domain', 'alertchannel', 'team', 'maintenance', 'subscriber'],
        required: true,
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
    },
    resourceName: {
        type: String,
        default: '',
    },
    changes: [changeSchema],
    ipAddress: {
        type: String,
        default: null,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: false }); // use our own timestamp field

auditLogSchema.index({ orgId: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ resourceType: 1 });
auditLogSchema.index({ action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
