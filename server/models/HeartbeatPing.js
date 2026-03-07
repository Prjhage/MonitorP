const mongoose = require('mongoose');

const heartbeatPingSchema = new mongoose.Schema({
    heartbeatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Heartbeat',
        required: true
    },
    receivedAt: {
        type: Date,
        default: Date.now
    },
    signalType: {
        type: String,
        enum: ['start', 'success', 'fail'],
        default: 'success'
    },
    jobDuration: {
        type: Number,
        default: null // ms
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    }
});

module.exports = mongoose.model('HeartbeatPing', heartbeatPingSchema);
