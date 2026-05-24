const mongoose = require('mongoose');

const maintenanceWindowSchema = new mongoose.Schema({
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        default: null,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    startTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
        required: true,
    },
    isRecurring: {
        type: Boolean,
        default: false,
    },
    // cron expression for recurring windows, e.g. "0 2 * * 0" = Sunday 2AM
    cronExpression: {
        type: String,
        default: null,
    },
    timezone: {
        type: String,
        default: 'UTC',
    },
    // 'all' means all monitors in the org, otherwise array of specific monitor ObjectIds
    affectedMonitors: {
        type: mongoose.Schema.Types.Mixed,
        default: 'all',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    // Track whether we've sent advance notification to subscribers
    notifiedSubscribers: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

maintenanceWindowSchema.index({ orgId: 1, isActive: 1 });
maintenanceWindowSchema.index({ userId: 1 });
maintenanceWindowSchema.index({ startTime: 1, endTime: 1 });

module.exports = mongoose.model('MaintenanceWindow', maintenanceWindowSchema);
