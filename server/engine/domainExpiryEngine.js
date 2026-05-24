/**
 * Domain Expiry Monitoring Engine
 * Uses 'whois' npm package for WHOIS lookups.
 * Runs once per day at 9 AM — WHOIS data changes slowly and too many
 * requests can get your IP rate-limited by registrars.
 */

const whois = require('whois');
const cron = require('node-cron');
const DomainMonitor = require('../models/DomainMonitor');
const User = require('../models/User');
const { dispatchAlerts } = require('../services/alerts/alertDispatcher');
const { isInMaintenance } = require('../utils/maintenanceCheck');

/**
 * Promisified WHOIS lookup.
 */
const lookupWhois = (domain) => {
    return new Promise((resolve, reject) => {
        whois.lookup(domain, { timeout: 15000 }, (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
};

/**
 * Parse raw WHOIS text into structured data.
 * Handles many registrar field name formats.
 */
const parseWhoisData = (rawWhois) => {
    const result = {
        expiryDate:  null,
        registrar:   null,
        createdDate: null,
        nameservers: [],
        rawStatus:   null,
    };

    const lines = rawWhois.split('\n');

    for (const line of lines) {
        const lower = line.toLowerCase().trim();
        const value = line.split(':').slice(1).join(':').trim();

        // Expiry date — many registrars use different field names
        if (
            lower.startsWith('expiry date') ||
            lower.startsWith('registry expiry date') ||
            lower.startsWith('expiration date') ||
            lower.startsWith('paid-till') ||
            lower.startsWith('expire:') ||
            lower.startsWith('expires on') ||
            lower.startsWith('renewal date') ||
            lower.startsWith('domain expires')
        ) {
            const parsed = new Date(value);
            if (!isNaN(parsed.getTime())) result.expiryDate = parsed;
        }

        // Registrar
        if (lower.startsWith('registrar:') && !result.registrar) {
            result.registrar = value;
        }

        // Created date
        if (
            (lower.startsWith('creation date') || lower.startsWith('created:') || lower.startsWith('created on')) &&
            !result.createdDate
        ) {
            const parsed = new Date(value);
            if (!isNaN(parsed.getTime())) result.createdDate = parsed;
        }

        // Nameservers
        if (lower.startsWith('name server:') || lower.startsWith('nserver:')) {
            const ns = value.toLowerCase().trim();
            if (ns && !result.nameservers.includes(ns)) result.nameservers.push(ns);
        }

        // Status
        if (lower.startsWith('domain status:') && !result.rawStatus) {
            result.rawStatus = value;
        }
    }

    return result;
};

/**
 * Calculate days remaining until expiry.
 */
const getDaysRemaining = (expiryDate) => {
    if (!expiryDate) return null;
    const diffMs = new Date(expiryDate).getTime() - Date.now();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Determine which alert level to send, if any.
 * Returns the alert key or null if no alert needed.
 */
const getAlertLevel = (daysRemaining, alertsSent) => {
    if (daysRemaining === null) return null;
    if (daysRemaining <= 0  && !alertsSent.expired) return 'expired';
    if (daysRemaining <= 1  && !alertsSent.days1)   return 'days1';
    if (daysRemaining <= 3  && !alertsSent.days3)   return 'days3';
    if (daysRemaining <= 7  && !alertsSent.days7)   return 'days7';
    if (daysRemaining <= 15 && !alertsSent.days15)  return 'days15';
    if (daysRemaining <= 30 && !alertsSent.days30)  return 'days30';
    if (daysRemaining <= 60 && !alertsSent.days60)  return 'days60';
    return null;
};

/**
 * Process a single domain monitor: WHOIS lookup, update DB, send alerts.
 */
const processDomainMonitor = async (monitor) => {
    console.log(`[DOMAIN] Checking WHOIS for: ${monitor.domain}`);

    let parsed;
    try {
        const raw = await lookupWhois(monitor.domain);
        parsed = parseWhoisData(raw);
    } catch (err) {
        console.error(`[DOMAIN] WHOIS lookup failed for ${monitor.domain}:`, err.message);
        monitor.lastCheckedAt = new Date();
        await monitor.save();
        return;
    }

    // Update WHOIS data
    monitor.whoisData = {
        registrar:   parsed.registrar,
        expiryDate:  parsed.expiryDate,
        createdDate: parsed.createdDate,
        nameservers: parsed.nameservers,
        rawStatus:   parsed.rawStatus,
        lastFetched: new Date(),
    };
    monitor.lastCheckedAt = new Date();

    // Alert logic
    const daysRemaining = getDaysRemaining(parsed.expiryDate);
    const alertLevel = getAlertLevel(daysRemaining, monitor.alertsSent);

    if (alertLevel) {
        try {
            const user = await User.findById(monitor.userId);
            if (user) {
                const monitorData = { ...monitor.toObject(), monitorType: 'domain' };
                const simulatedIncident = {
                    daysRemaining,
                    alertLevel
                };
                await dispatchAlerts(monitorData, simulatedIncident, 'down');
                monitor.alertsSent[alertLevel] = true;
                console.log(`[DOMAIN] Alert dispatched for ${monitor.domain} — ${alertLevel} (${daysRemaining} days remaining)`);
            }
        } catch (emailErr) {
            console.error(`[DOMAIN] Failed to dispatch alert for ${monitor.domain}:`, emailErr.message);
        }
    }

    await monitor.save();
};

/**
 * Start the domain expiry cron job.
 * Runs once per day at 9:00 AM.
 */
const startDomainExpiryEngine = () => {
    const runChecks = async () => {
        console.log('[DOMAIN] Running domain expiry check cycle...');
        try {
            const monitors = await DomainMonitor.find({ isActive: true });
            if (monitors.length === 0) {
                console.log('[DOMAIN] No active domain monitors.');
                return;
            }

            console.log(`[DOMAIN] Processing ${monitors.length} domain monitors...`);

            // Process sequentially to avoid WHOIS rate limiting
            for (const monitor of monitors) {
                await processDomainMonitor(monitor).catch(err =>
                    console.error(`[DOMAIN] Uncaught error for ${monitor.domain}:`, err.message)
                );
                // Small delay between requests to avoid rate limiting
                await new Promise(r => setTimeout(r, 2000));
            }

        } catch (err) {
            console.error('[DOMAIN] Engine cron error:', err.message);
        }
    };

    // Run every day at 9:00 AM
    cron.schedule('0 9 * * *', runChecks);

    // Also run on startup after 15 seconds
    setTimeout(runChecks, 15000);
};

module.exports = { startDomainExpiryEngine, processDomainMonitor, getDaysRemaining };
