const cron = require('node-cron');
const ApiKey = require('../models/ApiKey');
const User = require('../models/User');
const { runWithLimit } = require('../utils/async');
const { isInMaintenance } = require('../utils/maintenanceCheck');

const startApiKeyChecker = (io) => {
    // Run daily at midnight
    cron.schedule('0 0 * * *', async () => {
        const startTime = Date.now();
        console.log('[API Key] Starting daily check cycle...');
        try {
            const now = new Date();
            const keys = await ApiKey.find({ status: { $ne: 'EXPIRED' } });
            
            if (keys.length === 0) {
                console.log('[API Key] No active keys found.');
                return;
            }

            console.log(`[API Key] Processing ${keys.length} keys...`);

            await runWithLimit(10, keys, async (key) => {
                const diffTime = key.expiryDate - now;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let shouldAlert = false;
                let alertThreshold = null;

                if (diffDays <= 0) {
                    key.status = 'EXPIRED';
                    shouldAlert = true;
                    alertThreshold = 0;
                } else if (diffDays <= 7 && key.lastAlertDays !== 7) {
                    key.status = 'EXPIRING_SOON';
                    shouldAlert = true;
                    alertThreshold = 7;
                } else if (diffDays <= 15 && key.lastAlertDays !== 15 && key.lastAlertDays !== 7) {
                    key.status = 'EXPIRING_SOON';
                    shouldAlert = true;
                    alertThreshold = 15;
                } else if (diffDays <= 30 && key.lastAlertDays === null) {
                    key.status = 'EXPIRING_SOON';
                    shouldAlert = true;
                    alertThreshold = 30;
                }

                if (shouldAlert) {
                    key.lastAlertDays = alertThreshold;
                    await key.save();

                    const user = await User.findById(key.userId);
                    if (user) {
                        const alertData = {
                            subject: `⚠️ API Key Expiry Alert: ${key.serviceName} (${key.environment})`,
                            text: `Your ${key.keyType} for ${key.serviceName} in ${key.environment} environment is ${diffDays <= 0 ? 'EXPIRED' : `expiring in ${diffDays} days`}.\n\nKey Preview: ${key.keyPreview}\nExpiry Date: ${key.expiryDate.toDateString()}\n\nPlease rotate your key to avoid service interruption.`,
                            html: `
                                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                                    <h2 style="color: ${diffDays <= 0 ? '#ef4444' : '#f59e0b'};">API Key ${diffDays <= 0 ? 'Expired' : 'Expiring Soon'}</h2>
                                    <p>Your <b>${key.keyType}</b> for <b>${key.serviceName}</b> (${key.environment}) is ${diffDays <= 0 ? '<b>EXPIRED</b>' : `expiring in <b>${diffDays} days</b>`}.</p>
                                    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                        <p style="margin: 5px 0;"><b>Key Preview:</b> ${key.keyPreview}</p>
                                        <p style="margin: 5px 0;"><b>Expiry Date:</b> ${key.expiryDate.toDateString()}</p>
                                    </div>
                                    <p>Please rotate your key to avoid service interruption.</p>
                                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                                    <p style="color: #6b7280; font-size: 12px;">This is an automated alert from PingForge.</p>
                                </div>
                            `
                        };

                        try {
                            const { transporter } = require('../utils/mailer');
                            await transporter.sendMail({
                                from: `"PingForge Alerts" <${process.env.EMAIL_USER}>`,
                                to: key.alertEmail || user.email,
                                subject: alertData.subject,
                                text: alertData.text,
                                html: alertData.html
                            });
                            console.log(`[API Key] Alert sent for key: ${key.serviceName} to ${key.alertEmail || user.email}`);
                        } catch (mailError) {
                            console.error(`[API Key] Failed to send alert for ${key.serviceName}:`, mailError.message);
                        }
                    }
                }
            });

            const duration = Date.now() - startTime;
            console.log(`[API Key] Cycle completed in ${duration}ms.`);

        } catch (error) {
            console.error('[API Key] Critical Error in checker:', error);
        }
    });

    // Run once on startup for debugging/initial check
    process.nextTick(async () => {
        console.log('🚀 Initial API Key check scheduled on startup...');
    });
};

module.exports = { startApiKeyChecker };
