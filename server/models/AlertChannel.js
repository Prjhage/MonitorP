const mongoose = require('mongoose');

const alertChannelSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Firebase UID or mongoose ObjectId. Since the rest the app uses mongoose references, we'll keep it as String for Firebase UID if that's what the app uses, or ObjectId. I'll use String for Firebase UID based on the prompt. Wait, the snippet says `userId: String, // Firebase UID`
    name: { type: String, required: true },
    type: { type: String, enum: ['slack', 'discord', 'teams', 'webhook'], required: true },
    webhookUrl: { type: String, required: true }, // Encrypted at rest
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    webhookConfig: {
        headers: { type: Object },
        method: { type: String, default: 'POST' }
    }
});

module.exports = mongoose.model('AlertChannel', alertChannelSchema);
