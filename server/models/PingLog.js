const mongoose = require('mongoose');

const assertionResultSchema = new mongoose.Schema({
    name: { type: String },
    passed: { type: Boolean },
    actual: { type: String },
}, { _id: false });

const pingLogSchema = new mongoose.Schema({
    apiId: { type: mongoose.Schema.Types.ObjectId, ref: 'API', required: true },
    status: { type: String, enum: ['UP', 'DOWN', 'DEGRADED'], required: true },
    statusCode: { type: Number },
    responseTime: { type: Number }, // in ms
    reason: { type: String },
    checkedAt: { type: Date, default: Date.now },

    // --- Feature 1: Assertion results ---
    assertionResults: [assertionResultSchema],

    // --- Feature 2: Geographic Region ---
    region: { type: String, default: 'us-east' },
});

// Index for performance when querying logs for charts
pingLogSchema.index({ apiId: 1, checkedAt: -1 });
pingLogSchema.index({ apiId: 1, region: 1, checkedAt: -1 });

module.exports = mongoose.model('PingLog', pingLogSchema);
