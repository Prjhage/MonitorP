const mongoose = require('mongoose');

const heartbeatIncidentSchema = new mongoose.Schema({
    heartbeatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Heartbeat',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['OPEN', 'RESOLVED'],
        default: 'OPEN'
    },
    missedAt: {
        type: Date
    },
    detectedAt: {
        type: Date,
        default: Date.now
    },
    resolvedAt: {
        type: Date
    },
    duration: {
        type: Number // in minutes
    },
    alertSent: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('HeartbeatIncident', heartbeatIncidentSchema);
