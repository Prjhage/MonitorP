const mongoose = require('mongoose');
const crypto = require('crypto');

const statusPageSubscriberSchema = new mongoose.Schema({
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        default: null,
    },
    // userId of the status page owner (for backward compat when no orgId)
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verifyToken: {
        type: String,
        default: () => crypto.randomBytes(32).toString('hex'),
    },
    // Separate token for one-click unsubscribe
    unsubToken: {
        type: String,
        default: () => crypto.randomBytes(32).toString('hex'),
    },
    subscribedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

statusPageSubscriberSchema.index({ userId: 1 });
statusPageSubscriberSchema.index({ orgId: 1 });
statusPageSubscriberSchema.index({ verifyToken: 1 });
statusPageSubscriberSchema.index({ unsubToken: 1 });
// Unique per email per status page
statusPageSubscriberSchema.index({ userId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('StatusPageSubscriber', statusPageSubscriberSchema);
