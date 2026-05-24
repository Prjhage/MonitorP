const mongoose = require('mongoose');

const domainMonitorSchema = new mongoose.Schema({
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
    alertEmail: {
        type: String,
        default: '',
    },
    alertChannels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AlertChannel' }],
    checkInterval: {
        type: Number,
        default: 24,  // hours
    },
    lastCheckedAt: {
        type: Date,
        default: null,
    },
    isActive: {
        type: Boolean,
        default: true,
    },

    // Populated after WHOIS lookup
    whoisData: {
        registrar:   { type: String, default: null },
        expiryDate:  { type: Date,   default: null },
        createdDate: { type: Date,   default: null },
        nameservers: { type: [String], default: [] },
        lastFetched: { type: Date,   default: null },
        rawStatus:   { type: String, default: null },
    },

    // Prevents sending same alert twice — reset when user renews domain
    alertsSent: {
        days60:  { type: Boolean, default: false },
        days30:  { type: Boolean, default: false },
        days15:  { type: Boolean, default: false },
        days7:   { type: Boolean, default: false },
        days3:   { type: Boolean, default: false },
        days1:   { type: Boolean, default: false },
        expired: { type: Boolean, default: false },
    },
}, { timestamps: true });

domainMonitorSchema.index({ userId: 1 });
domainMonitorSchema.index({ isActive: 1 });

module.exports = mongoose.model('DomainMonitor', domainMonitorSchema);
