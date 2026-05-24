const mongoose = require('mongoose');

const dnsCheckLogSchema = new mongoose.Schema({
    dnsMonitorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DnsMonitor',
        required: true,
    },
    status: {
        type: String,
        enum: ['ok', 'changed', 'failed'],
        required: true,
    },
    records: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    changes: [
        {
            type:   { type: String },
            oldVal: { type: mongoose.Schema.Types.Mixed },
            newVal: { type: mongoose.Schema.Types.Mixed },
        }
    ],
    reason: {
        type: String,
        default: null,
    },
    checkedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: false });

dnsCheckLogSchema.index({ dnsMonitorId: 1, checkedAt: -1 });

module.exports = mongoose.model('DnsCheckLog', dnsCheckLogSchema);
