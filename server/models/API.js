const mongoose = require('mongoose');

const assertionSchema = new mongoose.Schema({
    type: { type: String, enum: ['status_code', 'response_time', 'body_contains', 'body_json_path'], required: true },
    operator: { type: String, enum: ['eq', 'lt', 'gt', 'contains', 'not_contains'], required: true },
    value: { type: String, required: true },
    jsonPath: { type: String }, // used when type is body_json_path
}, { _id: false });

const kvPairSchema = new mongoose.Schema({
    key: { type: String, required: true },
    value: { type: String, default: '' },
}, { _id: false });

const apiSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    method: { type: String, enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'], default: 'GET' },
    expectedStatus: { type: Number, default: 200 },
    interval: { type: Number, default: 5 }, // in minutes
    timeout: { type: Number, default: 10000 }, // in ms
    alertEmail: { type: String },
    status: { type: String, enum: ['UP', 'DOWN', 'DEGRADED', 'PENDING'], default: 'PENDING' },
    lastChecked: { type: Date },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },

    // --- Advanced API Testing (Postman-lite) ---
    headers: [kvPairSchema],
    queryParams: [kvPairSchema],
    body: { type: String, default: '' }, // raw JSON body string
    assertions: [assertionSchema],
});

module.exports = mongoose.model('API', apiSchema);
