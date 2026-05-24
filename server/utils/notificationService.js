const Notification = require('../models/Notification');

/**
 * createNotification
 * Utility to send in-app notifications to a user or group.
 */
const createNotification = async ({ userId, orgId, title, message, type = 'info', link = '' }) => {
    try {
        const notification = await Notification.create({
            userId,
            orgId,
            title,
            message,
            type,
            link
        });
        
        // If you have Socket.io set up in index.js, you'd emit here
        // if (global.io) {
        //   global.io.to(userId.toString()).emit('notification', notification);
        // }
        
        return notification;
    } catch (err) {
        console.error('[NotificationService] Failed to create notification:', err.message);
    }
};

module.exports = { createNotification };
