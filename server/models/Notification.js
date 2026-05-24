const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['info', 'success', 'warning', 'error', 'incident', 'maintenance', 'team'],
        default: 'info',
    },
    link: {
        type: String, // Optional link to a dashboard page
    },
    isRead: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ orgId: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
