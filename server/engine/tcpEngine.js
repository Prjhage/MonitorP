/**
 * TCP Port Monitoring Engine
 * Uses Node.js built-in 'net' module — zero new packages needed.
 * Runs every minute, checks all active TCP monitors.
 */

const net = require('net');
const cron = require('node-cron');
const TcpMonitor = require('../models/TcpMonitor');
const TcpPingLog = require('../models/TcpPingLog');
const User = require('../models/User');
const { dispatchAlerts } = require('../services/alerts/alertDispatcher');
const { runWithLimit } = require('../utils/async');
const { isInMaintenance } = require('../utils/maintenanceCheck');

/**
 * Attempt a TCP connection to host:port.
 * Returns { status, responseTime, reason }.
 */
const checkTcpPort = (host, port, timeout = 10000) => {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const socket = new net.Socket();

        socket.setTimeout(timeout);

        socket.connect(port, host, () => {
            const responseTime = Date.now() - startTime;
            socket.destroy();
            resolve({ status: 'up', responseTime, reason: null });
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve({
                status: 'down',
                responseTime: null,
                reason: `Connection timed out after ${timeout}ms`,
            });
        });

        socket.on('error', (err) => {
            socket.destroy();
            const reasons = {
                ECONNREFUSED: 'Connection refused — port is closed or service stopped',
                ENOTFOUND:    'Host not found — DNS resolution failed',
                ETIMEDOUT:    'Connection timed out — host unreachable',
                EHOSTUNREACH: 'Host unreachable — no network route to host',
            };
            resolve({
                status: 'down',
                responseTime: null,
                reason: reasons[err.code] || err.message,
            });
        });
    });
};

/**
 * Process a single TCP monitor: check port, update DB, send alerts.
 */
const processTcpMonitor = async (monitor, io) => {
    // Respect check interval — skip if not due yet
    if (monitor.lastCheckedAt) {
        const minutesSinceLast = (Date.now() - new Date(monitor.lastCheckedAt).getTime()) / 60000;
        if (minutesSinceLast < monitor.checkInterval) return;
    }

    console.log(`[TCP] Checking ${monitor.host}:${monitor.port} (${monitor.name})`);

    const result = await checkTcpPort(monitor.host, monitor.port, monitor.timeout);
    const previousStatus = monitor.status;

    monitor.lastCheckedAt = new Date();
    monitor.lastResponseTime = result.responseTime;
    monitor.lastError = result.reason;
    monitor.status = result.status;

    // Save ping log
    await TcpPingLog.create({
        tcpMonitorId: monitor._id,
        status:       result.status,
        responseTime: result.responseTime,
        reason:       result.reason,
    });

    // Alert logic — send when transitioning DOWN, recover when transitioning UP
    try {
        const skip = await isInMaintenance(monitor._id, monitor.orgId, monitor.userId);
        if (skip) {
            console.log(`[TCP] Maintenance window active — skipping alert for ${monitor.host}:${monitor.port}`);
        } else {
            const user = await User.findById(monitor.userId);
            if (user) {
                const monitorData = { ...monitor.toObject(), monitorType: 'tcp' };
                if (result.status === 'down' && previousStatus !== 'down') {
                    const simulatedIncident = { reason: result.reason, startedAt: new Date() };
                    await dispatchAlerts(monitorData, simulatedIncident, 'down');
                    console.log(`[TCP] DOWN alert dispatched for ${monitor.host}:${monitor.port}`);
                } else if (result.status === 'up' && previousStatus === 'down') {
                    const simulatedIncident = {
                        duration: Math.round((new Date() - new Date(monitor.updatedAt)) / 60000),
                        startedAt: monitor.updatedAt,
                    };
                    await dispatchAlerts(monitorData, simulatedIncident, 'recovery');
                    console.log(`[TCP] RECOVERY alert dispatched for ${monitor.host}:${monitor.port}`);
                }
            }
        }
    } catch (emailErr) {
        console.error(`[TCP] Failed to send alert for ${monitor.host}:${monitor.port}:`, emailErr.message);
    }

    await monitor.save();

    // Emit live socket update
    if (io) {
        io.emit('tcp-update', {
            tcpId:        monitor._id,
            status:       monitor.status,
            responseTime: monitor.lastResponseTime,
            lastCheckedAt: monitor.lastCheckedAt,
        });
    }
};

/**
 * Start the TCP monitoring cron job. Runs every minute.
 */
const startTcpEngine = (io) => {
    const runChecks = async () => {
        console.log('[TCP] Running TCP port check cycle...');
        try {
            const monitors = await TcpMonitor.find({ isActive: true });
            if (monitors.length === 0) {
                console.log('[TCP] No active TCP monitors.');
                return;
            }

            console.log(`[TCP] Processing ${monitors.length} TCP monitors...`);

            await runWithLimit(20, monitors, async (monitor) => {
                return processTcpMonitor(monitor, io).catch(err =>
                    console.error(`[TCP] Uncaught error for ${monitor.host}:${monitor.port}:`, err.message)
                );
            });

        } catch (err) {
            console.error('[TCP] Engine cron error:', err.message);
        }
    };

    cron.schedule('* * * * *', runChecks);

    // Immediate first run after 5s
    setTimeout(runChecks, 5000);
};

module.exports = { startTcpEngine, processTcpMonitor, checkTcpPort };
