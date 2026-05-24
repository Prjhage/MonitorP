const mongoose = require('mongoose');

const alertLogSchema = new mongoose.Schema({
    alertChannelId: { type: mongoose.Schema.Types.ObjectId, ref: 'AlertChannel', required: true },
    monitorId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Not constrained to a particular collection due to multiple monitor types
    monitorType: { type: String, enum: ['api', 'tcp', 'dns', 'heartbeat', 'ssl', 'domain'], required: true },
    incidentId: { type: mongoose.Schema.Types.ObjectId }, // Note: some engines don't create an Incident collection object, so this can be a simulated ID or actual ref
    type: { type: String, enum: ['down', 'recovery'], required: true },
    status: { type: String, enum: ['sent', 'failed'], required: true },
    errorMessage: { type: String },
    sentAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AlertLog', alertLogSchema);
