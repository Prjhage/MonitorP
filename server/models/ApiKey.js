const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    serviceName: {
        type: String,
        required: true,
        // e.g., "Stripe", "Twilio", "AWS"
    },
    keyType: {
        type: String,
        required: true,
        // e.g., "Secret Key", "Access Key", "Public Key"
    },
    keyPreview: {
        type: String,
        required: true,
        // Store only a preview, e.g., "sk_live_...1a2b"
    },
    expiryDate: {
        type: Date,
        required: true,
    },
    environment: {
        type: String,
        enum: ['Production', 'Staging', 'Development', 'Local'],
        default: 'Production',
    },
    alertEmail: {
        type: String,
    },
    status: {
        type: String,
        enum: ['VALID', 'EXPIRING_SOON', 'EXPIRED'],
        default: 'VALID',
    },
    lastAlertDays: {
        type: Number, // 30, 15, 7, 0
        default: null,
    },
    notes: {
        type: String,
    }
}, { timestamps: true });

// Update status before saving
apiKeySchema.pre('save', function(next) {
    if (this.expiryDate) {
        const now = new Date();
        const diffTime = this.expiryDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
            this.status = 'EXPIRED';
        } else if (diffDays <= 30) {
            this.status = 'EXPIRING_SOON';
        } else {
            this.status = 'VALID';
        }
    }
    next();
});

// Index for performance
apiKeySchema.index({ status: 1 });
apiKeySchema.index({ userId: 1 });

module.exports = mongoose.model('ApiKey', apiKeySchema);
