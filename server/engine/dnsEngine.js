/**
 * DNS Monitoring Engine
 * Uses Node.js built-in 'dns/promises' — zero new packages needed.
 * Runs every 15 minutes. First check captures baseline, subsequent checks detect changes.
 */

const dns = require('dns').promises;
const cron = require('node-cron');
const DnsMonitor = require('../models/DnsMonitor');
const DnsCheckLog = require('../models/DnsCheckLog');
const User = require('../models/User');
const { dispatchAlerts } = require('../services/alerts/alertDispatcher');
const { runWithLimit } = require('../utils/async');
const { isInMaintenance } = require('../utils/maintenanceCheck');

/**
 * Resolve all requested record types for a domain.
 */
const resolveDomain = async (domain, recordTypes) => {
    const records = {};
    for (const type of recordTypes) {
        try {
            if (type === 'A')     records.A     = await dns.resolve4(domain);
            if (type === 'AAAA')  records.AAAA  = await dns.resolve6(domain);
            if (type === 'MX')    records.MX    = await dns.resolveMx(domain);
            if (type === 'CNAME') records.CNAME = await dns.resolveCname(domain);
            if (type === 'TXT')   records.TXT   = await dns.resolveTxt(domain);
            if (type === 'NS')    records.NS    = await dns.resolveNs(domain);
        } catch {
            records[type] = [];
        }
    }
    return records;
};

/**
 * Deep compare baseline vs current records.
 * Returns array of { type, oldVal, newVal } for any changed types.
 */
const detectChanges = (baseline, current, recordTypes) => {
    const changes = [];
    for (const type of recordTypes) {
        const old = JSON.stringify((baseline[type] || []).sort ? [...(baseline[type] || [])].sort() : baseline[type] || []);
        const now = JSON.stringify((current[type] || []).sort ? [...(current[type] || [])].sort() : current[type] || []);
        if (old !== now) {
            changes.push({ type, oldVal: baseline[type], newVal: current[type] });
        }
    }
    return changes;
};

/**
 * Process a single DNS monitor.
 */
const processDnsMonitor = async (monitor, io) => {
    // Respect check interval
    if (monitor.lastCheckedAt) {
        const minutesSinceLast = (Date.now() - new Date(monitor.lastCheckedAt).getTime()) / 60000;
        // Subtract 0.1 mins (6 seconds) buffer to account for cron firing slightly early
        if (minutesSinceLast < (monitor.checkInterval - 0.1)) return;
    }

    console.log(`[DNS] Checking records for: ${monitor.domain}`);

    let currentRecords;
    let failed = false;
    let failReason = null;

    try {
        currentRecords = await resolveDomain(monitor.domain, monitor.recordTypes);
    } catch (err) {
        failed = true;
        failReason = err.message;
        console.error(`[DNS] Resolution failed for ${monitor.domain}:`, err.message);
    }

    monitor.lastCheckedAt = new Date();

    if (failed) {
        monitor.status = 'failed';

        await DnsCheckLog.create({
            dnsMonitorId: monitor._id,
            status:       'failed',
            records:      {},
            changes:      [],
            reason:       failReason,
        });

        // Alert on failure
        try {
            const skip = await isInMaintenance(monitor._id, monitor.orgId, monitor.userId);
            if (!skip) {
                const user = await User.findById(monitor.userId);
                if (user) {
                    await dispatchAlerts({ ...monitor.toObject(), monitorType: 'dns' }, { reason: failReason }, 'down');
                }
            } else {
                console.log(`[DNS] Maintenance window active — skipping failure alert for ${monitor.domain}`);
            }
        } catch (emailErr) {
            console.error(`[DNS] Failed to dispatch failure alert for ${monitor.domain}:`, emailErr.message);
        }

    } else if (!monitor.baseline || !monitor.baseline.capturedAt) {
        // First ever check — save as baseline, no alert
        monitor.baseline = { ...currentRecords, capturedAt: new Date() };
        monitor.status = 'ok';
        console.log(`[DNS] Baseline captured for ${monitor.domain}`);

        await DnsCheckLog.create({
            dnsMonitorId: monitor._id,
            status:       'ok',
            records:      currentRecords,
            changes:      [],
            reason:       'Baseline captured',
        });

    } else {
        // Compare against baseline
        const changes = detectChanges(monitor.baseline, currentRecords, monitor.recordTypes);

        if (changes.length > 0) {
            monitor.status = 'changed';
            console.log(`[DNS] CHANGE DETECTED for ${monitor.domain}:`, changes);

            await DnsCheckLog.create({
                dnsMonitorId: monitor._id,
                status:       'changed',
                records:      currentRecords,
                changes,
            });

            // Alert on change
            try {
                const user = await User.findById(monitor.userId);
                if (user) {
                    await dispatchAlerts({ ...monitor.toObject(), monitorType: 'dns' }, { changes, currentRecords }, 'recovery');
                }
            } catch (emailErr) {
                console.error(`[DNS] Failed to dispatch change alert for ${monitor.domain}:`, emailErr.message);
            }

        } else {
            monitor.status = 'ok';

            await DnsCheckLog.create({
                dnsMonitorId: monitor._id,
                status:       'ok',
                records:      currentRecords,
                changes:      [],
            });
        }
    }

    await monitor.save();

    // Emit live socket update
    if (io) {
        io.emit('dns-update', {
            dnsId:        monitor._id,
            status:       monitor.status,
            lastCheckedAt: monitor.lastCheckedAt,
        });
    }
};

/**
 * Start the DNS monitoring cron job. Runs every 15 minutes.
 */
const startDnsEngine = (io) => {
    const runChecks = async () => {
        console.log('[DNS] Running DNS check cycle...');
        try {
            const monitors = await DnsMonitor.find({ isActive: true });
            if (monitors.length === 0) {
                console.log('[DNS] No active DNS monitors.');
                return;
            }

            console.log(`[DNS] Processing ${monitors.length} DNS monitors...`);

            await runWithLimit(15, monitors, async (monitor) => {
                return processDnsMonitor(monitor, io).catch(err =>
                    console.error(`[DNS] Uncaught error for ${monitor.domain}:`, err.message)
                );
            });

        } catch (err) {
            console.error('[DNS] Engine cron error:', err.message);
        }
    };

    // Run every 15 minutes
    cron.schedule('*/15 * * * *', runChecks);

    // Immediate first run after 8s
    setTimeout(runChecks, 8000);
};

module.exports = { startDnsEngine, processDnsMonitor, resolveDomain };
