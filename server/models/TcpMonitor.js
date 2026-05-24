const mongoose = require('mongoose');

const tcpMonitorSchema = new mongoose.Schema({
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
    host: {
        type: String,
        required: true,
        trim: true,
    },
    port: {
        type: Number,
        required: true,
        min: 1,
        max: 65535,
    },
    checkInterval: {
        type: Number,
        default: 5,  // minutes
        enum: [1, 5, 15, 30],
    },
    timeout: {
        type: Number,
        default: 10000,  // ms
    },
    alertEmail: {
        type: String,
        default: '',
    },
    alertChannels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AlertChannel' }],
    status: {
        type: String,
        enum: ['up', 'down', 'pending'],
        default: 'pending',
    },
    lastCheckedAt: {
        type: Date,
        default: null,
    },
    lastResponseTime: {
        type: Number,
        default: null,
    },
    lastError: {
        type: String,
        default: null,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

tcpMonitorSchema.index({ userId: 1 });
tcpMonitorSchema.index({ isActive: 1 });

module.exports = mongoose.model('TcpMonitor', tcpMonitorSchema);
