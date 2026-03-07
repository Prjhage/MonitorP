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
        enum: ['UP', 'DOWN', 'PENDING', 'RUNNING'],
        default: 'PENDING'
    },
    scheduleType: {
        type: String,
        enum: ['interval', 'cron'],
        default: 'interval'
    },
    cronExpression: {
        type: String,
        default: null
    },
    timezone: {
        type: String,
        default: 'UTC'
    },
    maxDuration: {
        type: Number,
        default: null // in minutes/seconds/hours
    },
    maxDurationUnit: {
        type: String,
        enum: ['seconds', 'minutes', 'hours'],
        default: 'minutes'
    },
    avgJobDuration: {
        type: Number,
        default: 0 // ms
    },
    lastJobDuration: {
        type: Number,
        default: 0 // ms
    },
    currentJobStartedAt: {
        type: Date,
        default: null
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
    },
    isPaused: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Heartbeat', heartbeatSchema);
