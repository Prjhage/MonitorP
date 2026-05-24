const cron = require('node-cron');
const MaintenanceWindow = require('../models/MaintenanceWindow');
const StatusPageSubscriber = require('../models/StatusPageSubscriber');
const User = require('../models/User');
const { transporter } = require('../utils/mailer');

/**
 * Maintenance Engine
 * 1. Checks for maintenance windows starting in the next 15 minutes
 * 2. Notifies status page subscribers via email
 */
const startMaintenanceEngine = () => {
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        try {
            const fifteenMinsFromNow = new Date(Date.now() + 15 * 60 * 1000);
            const now = new Date();

            // Find windows starting soon that haven't notified yet
            const upcomingWindows = await MaintenanceWindow.find({
                startTime: { $gte: now, $lte: fifteenMinsFromNow },
                notifiedSubscribers: false,
                isActive: true
            });

            for (const window of upcomingWindows) {
                // Get the user/org to get the company name
                const user = await User.findOne({ orgId: window.orgId }) || await User.findById(window.userId);
                if (!user) continue;

                // Find all subscribers for this company
                const subscribers = await StatusPageSubscriber.find({ 
                    companyName: user.companyName, 
                    isVerified: true 
                });

                if (subscribers.length === 0) {
                    window.notifiedSubscribers = true;
                    await window.save();
                    continue;
                }

                console.log(`[Maintenance] Notifying ${subscribers.length} subscribers for ${user.companyName} maintenance: ${window.name}`);

                // Send emails
                for (const sub of subscribers) {
                    try {
                        await transporter.sendMail({
                            from: `"PingForge Status" <${process.env.EMAIL_USER}>`,
                            to: sub.email,
                            subject: `[Maintenance] Scheduled downtime for ${user.companyName}`,
                            html: `
                                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #fafafa; border: 1px solid #eee; border-radius: 12px;">
                                    <h2 style="color: #f59e0b; margin-top: 0;">Scheduled Maintenance</h2>
                                    <p style="color: #444; line-height: 1.6;">
                                        ${user.companyName} has scheduled maintenance starting soon:
                                    </p>
                                    <div style="background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                        <div style="font-weight: 800; font-size: 18px; margin-bottom: 5px;">${window.name}</div>
                                        <div style="color: #666; font-size: 14px;">
                                            Starts: ${window.startTime.toLocaleString()}<br>
                                            Ends: ${window.endTime.toLocaleString()}
                                        </div>
                                    </div>
                                    <p style="color: #666; font-size: 13px;">
                                        Alerts for monitored services will be suppressed during this window.
                                    </p>
                                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                                    <p style="color: #999; font-size: 11px; text-align: center;">
                                        You are receiving this because you subscribed to status updates for ${user.companyName}.
                                    </p>
                                </div>
                            `
                        });
                    } catch (err) {
                        console.error(`[Maintenance] Failed to notify ${sub.email}:`, err.message);
                    }
                }

                window.notifiedSubscribers = true;
                await window.save();
            }
        } catch (error) {
            console.error('[Maintenance Engine Error]:', error);
        }
    });

    console.log('[Maintenance] Background engine started');
};

module.exports = { startMaintenanceEngine };
