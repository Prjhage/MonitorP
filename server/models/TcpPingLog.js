const mongoose = require('mongoose');

const tcpPingLogSchema = new mongoose.Schema({
    tcpMonitorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TcpMonitor',
        required: true,
    },
    status: {
        type: String,
        enum: ['up', 'down'],
        required: true,
    },
    responseTime: {
        type: Number,
        default: null,  // null if timed out / failed
    },
    reason: {
        type: String,
        default: null,  // null if up, error message if down
    },
    checkedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: false });

tcpPingLogSchema.index({ tcpMonitorId: 1, checkedAt: -1 });

module.exports = mongoose.model('TcpPingLog', tcpPingLogSchema);
