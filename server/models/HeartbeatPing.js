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
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    }
});

module.exports = mongoose.model('HeartbeatPing', heartbeatPingSchema);
