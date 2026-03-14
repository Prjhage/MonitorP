const mongoose = require('mongoose');

const sslMonitorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    domain: {
        type: String,
        required: true,
        // Store just the hostname, e.g. "google.com" (no https://, no path)
    },
    alertEmail: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    },

    // ── Cert data (populated after first check) ──────────────────────────────
    status: {
        type: String,
        enum: ['VALID', 'EXPIRING_SOON', 'EXPIRED', 'ERROR', 'PENDING'],
        default: 'PENDING',
    },
    issuer: {
        type: String,
        default: null,
    },
    issuerOrg: {
        type: String,
        default: null,
    },
    validFrom: {
        type: Date,
        default: null,
    },
    validTo: {
        type: Date,
        default: null,
    },
    daysRemaining: {
        type: Number,
        default: null,
    },
    isChainValid: {
        type: Boolean,
        default: null,
    },
    lastChecked: {
        type: Date,
        default: null,
    },
    lastError: {
        type: String,
        default: null,
    },

    // ── Alert deduplication ────────────────────────────────────────────────────
    // Tracks the last threshold (days) for which we sent an alert.
    // Possible values: 30, 15, 7, 1, 0, null
    lastAlertDays: {
        type: Number,
        default: null,
    },
}, { timestamps: true });

module.exports = mongoose.model('SslMonitor', sslMonitorSchema);
