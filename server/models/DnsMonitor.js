const mongoose = require('mongoose');

const dnsMonitorSchema = new mongoose.Schema({
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
    domain: {
        type: String,
        required: true,
        trim: true,
    },
    recordTypes: {
        type: [String],
        enum: ['A', 'AAAA', 'MX', 'CNAME', 'TXT', 'NS'],
        default: ['A'],
    },
    checkInterval: {
        type: Number,
        default: 15,  // minutes
        enum: [5, 15, 30, 60],
    },
    alertEmail: {
        type: String,
        default: '',
    },
    alertChannels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AlertChannel' }],
    status: {
        type: String,
        enum: ['ok', 'changed', 'failed', 'pending'],
        default: 'pending',
    },
    lastCheckedAt: {
        type: Date,
        default: null,
    },
    isActive: {
        type: Boolean,
        default: true,
    },

    // Captured on first check — used as reference forever after
    baseline: {
        A:     { type: [String], default: undefined },
        AAAA:  { type: [String], default: undefined },
        MX:    { type: mongoose.Schema.Types.Mixed, default: undefined },
        CNAME: { type: [String], default: undefined },
        TXT:   { type: mongoose.Schema.Types.Mixed, default: undefined },
        NS:    { type: [String], default: undefined },
        capturedAt: { type: Date, default: null },
    },
}, { timestamps: true });

dnsMonitorSchema.index({ userId: 1 });
dnsMonitorSchema.index({ isActive: 1 });

module.exports = mongoose.model('DnsMonitor', dnsMonitorSchema);
