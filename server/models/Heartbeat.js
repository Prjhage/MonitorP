const mongoose = require('mongoose');

const heartbeatSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    expectedEvery: {
        type: Number,
        required: true
    },
    expectedEveryUnit: {
        type: String,
        enum: ['minutes', 'hours', 'days'],
        default: 'hours'
    },
    gracePeriod: {
        type: Number,
        default: 30 // in minutes
    },
    alertEmail: {
        type: String
    },
    status: {
        type: String,
        enum: ['UP', 'DOWN', 'PENDING'],
        default: 'PENDING'
    },
    lastPingAt: {
        type: Date,
        default: null
    },
    nextExpectedAt: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Heartbeat', heartbeatSchema);
