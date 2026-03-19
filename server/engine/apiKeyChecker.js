const cron = require('node-cron');
const ApiKey = require('../models/ApiKey');
const User = require('../models/User');
const { sendAlertEmail } = require('../utils/mailer');

const startApiKeyChecker = (io) => {
    // Run daily at midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('🔍 Checking API Keys for expiry...');
        try {
            const now = new Date();
            const keys = await ApiKey.find({ status: { $ne: 'EXPIRED' } });

            for (const key of keys) {
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
                                    <p style="color: #6b7280; font-size: 12px;">This is an automated alert from MonitorP.</p>
                                </div>
                            `
                        };

                        // Use the existing mailer utility but we need to make it generic
                        // For now, let's assume we can pass custom subject/text to a generic sender
                        // or we just use the mailer we have.
                        try {
                            const { transporter } = require('../utils/mailer');
                            await transporter.sendMail({
                                from: `"MonitorP Alerts" <${process.env.EMAIL_USER}>`,
                                to: key.alertEmail || user.email,
                                subject: alertData.subject,
                                text: alertData.text,
                                html: alertData.html
                            });
                            console.log(`Alert sent for key: ${key.serviceName} to ${key.alertEmail || user.email}`);
                        } catch (mailError) {
                            console.error('Failed to send expiry email:', mailError);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('API Key Checker Error:', error);
        }
    });

    // Run once on startup for debugging/initial check
    process.nextTick(async () => {
        console.log('🚀 Initial API Key check on startup...');
        // We could trigger the same logic here if needed for testing
    });
};

module.exports = { startApiKeyChecker };
