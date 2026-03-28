/**
 * SSL Certificate Monitoring Engine
 * Runs every 12 hours, checks all active SSL monitors,
 * and sends tiered expiry alerts.
 */

const cron = require('node-cron');
const SslMonitor = require('../models/SslMonitor');
const User = require('../models/User');
const { checkSslCert } = require('./sslChecker');
const { sendSslExpiryWarning, sendSslExpiredAlert } = require('../utils/mailer');

// Alert thresholds in days (ordered: most urgent last so we match the closest)
const ALERT_THRESHOLDS = [30, 15, 7, 1, 0];

/**
 * Determine which alert threshold applies to daysRemaining.
 * Returns the threshold value, or null if none apply.
 */
const getAlertThreshold = (daysRemaining) => {
    if (daysRemaining <= 0)  return 0;
    if (daysRemaining <= 1)  return 1;
    if (daysRemaining <= 7)  return 7;
    if (daysRemaining <= 15) return 15;
    if (daysRemaining <= 30) return 30;
    return null; // more than 30 days — no alert needed
};

/**
 * Derive a status string from check results.
 */
const deriveStatus = (error, daysRemaining) => {
    if (error)               return 'ERROR';
    if (daysRemaining <= 0)  return 'EXPIRED';
    if (daysRemaining <= 30) return 'EXPIRING_SOON';
    return 'VALID';
};

/**
 * Process a single SSL monitor: check cert, update DB, send alerts.
 */
const processSslMonitor = async (monitor, io) => {
    console.log(`[SSL] Checking certificate for: ${monitor.domain}`);

    const result = await checkSslCert(monitor.domain);

    // Update cert data on the document
    monitor.lastChecked = new Date();
    monitor.lastError   = result.error || null;

    if (result.error) {
        monitor.status = 'ERROR';
        console.log(`[SSL] ERROR for ${monitor.domain}: ${result.error}`);
    } else {
        monitor.issuer       = result.issuer;
        monitor.issuerOrg    = result.issuerOrg;
        monitor.validFrom    = result.validFrom;
        monitor.validTo      = result.validTo;
        monitor.daysRemaining = result.daysRemaining;
        monitor.isChainValid = result.isChainValid;
        monitor.status       = deriveStatus(null, result.daysRemaining);

        console.log(`[SSL] ${monitor.domain} — ${result.daysRemaining} days remaining (${monitor.status})`);

        // ── Alert logic ────────────────────────────────────────────────────────
        const threshold = getAlertThreshold(result.daysRemaining);
        if (threshold !== null && threshold !== monitor.lastAlertDays) {
            // This threshold hasn't been alerted yet — send the email
            try {
                const user = await User.findById(monitor.userId);
                if (user) {
                    if (threshold === 0) {
                        await sendSslExpiredAlert(user, monitor);
                    } else {
                        await sendSslExpiryWarning(user, monitor, threshold);
                    }
                    monitor.lastAlertDays = threshold;
                    console.log(`[SSL] Alert sent for ${monitor.domain} at ${threshold}-day threshold`);
                }
            } catch (emailErr) {
                console.error(`[SSL] Failed to send alert for ${monitor.domain}:`, emailErr.message);
            }
        }
    }

    await monitor.save();

    // Emit live socket update
    if (io) {
        io.emit('ssl-update', {
            sslId: monitor._id,
            status: monitor.status,
            daysRemaining: monitor.daysRemaining,
            lastChecked: monitor.lastChecked,
        });
    }
};

const { runWithLimit } = require('../utils/async');

/**
 * Start the SSL monitoring cron job.
 * Runs every 12 hours and on startup (immediate first run).
 */
const startSslEngine = (io) => {
    const runChecks = async () => {
        const startTime = Date.now();
        console.log('[SSL] Running SSL certificate check cycle...');
        try {
            const monitors = await SslMonitor.find({ isActive: true });
            if (monitors.length === 0) {
                console.log('[SSL] No active monitors found.');
                return;
            }

            console.log(`[SSL] Processing ${monitors.length} certificates...`);

            // Use runWithLimit to process SSL checks in parallel (limit 10 at a time)
            // SSL checks can be slightly more intensive than simple HTTP pings
            await runWithLimit(10, monitors, async (monitor) => {
                // Add jitter to avoid burst
                await new Promise(resolve => setTimeout(resolve, Math.random() * 5000));
                return processSslMonitor(monitor, io).catch(err =>
                    console.error(`[SSL] Uncaught error for ${monitor.domain}:`, err.message)
                );
            });

            const duration = Date.now() - startTime;
            console.log(`[SSL] Cycle completed in ${duration}ms.`);

        } catch (err) {
            console.error('[SSL] Engine cron error:', err.message);
        }
    };

    // Run every 12 hours
    cron.schedule('0 */12 * * *', runChecks);

    // Also run immediately on startup (after a short delay for DB to be ready)
    setTimeout(runChecks, 10000);
};

module.exports = { startSslEngine, processSslMonitor };
