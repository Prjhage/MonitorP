const MaintenanceWindow = require('../models/MaintenanceWindow');

/**
 * Checks if a specific monitor is currently under maintenance.
 * @param {string} orgId - Organization ID
 * @param {string} userId - User ID (for personal accounts)
 * @param {string} monitorId - The ID of the monitor to check
 * @returns {Promise<boolean>}
 */
const isUnderMaintenance = async (orgId, userId, monitorId) => {
    try {
        const now = new Date();
        const filter = {
            isActive: true,
            startTime: { $lte: now },
            endTime: { $gte: now },
        };

        if (orgId) {
            filter.orgId = orgId;
        } else {
            filter.userId = userId;
        }

        const windows = await MaintenanceWindow.find(filter);
        
        if (windows.length === 0) return false;

        // If any window is 'all', the entire org is under maintenance
        if (windows.some(w => w.affectedMonitors === 'all')) return true;

        // Check if the specific monitorId is in the list of any active window
        return windows.some(w => {
            if (Array.isArray(w.affectedMonitors)) {
                return w.affectedMonitors.some(id => id.toString() === monitorId.toString());
            }
            return false;
        });
    } catch (error) {
        console.error('Maintenance check error:', error);
        return false;
    }
};

module.exports = { isUnderMaintenance };
