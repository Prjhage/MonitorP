const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
    apiId: { type: mongoose.Schema.Types.ObjectId, ref: 'API', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    status: { type: String, enum: ['OPEN', 'RESOLVED'], default: 'OPEN' },
    reason: { type: String },
    duration: { type: Number } // in minutes
});

module.exports = mongoose.model('Incident', incidentSchema);
