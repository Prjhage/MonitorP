/**
 * Unified Alert Formatter for PingForge
 * Standardizes metadata across API, TCP, DNS, SSL, Heartbeat, and Domain monitors.
 */

const formatAlert = (monitor, incident, type) => {
    const isDown = type === 'down';
    const monitorType = monitor.monitorType || 'api';

    // 1. Determine the "Target" based on monitor type
    let target = 'Unknown';
    if (monitorType === 'api') target = monitor.url;
    else if (monitorType === 'tcp') target = `${monitor.host}:${monitor.port}`;
    else if (monitorType === 'dns') target = monitor.domain;
    else if (monitorType === 'ssl') target = monitor.domain;
    else if (monitorType === 'domain') target = monitor.domain;
    else if (monitorType === 'heartbeat') target = monitor.slug || monitor.name;

    // 2. Base Info
    const info = {
        title: isDown ? `🚨 Alert: ${monitor.name} is DOWN` : `✅ Recovered: ${monitor.name} is UP`,
        status: isDown ? '🔴 DOWN' : '🟢 UP',
        targetLabel: monitorType === 'api' ? 'URL' : (monitorType === 'tcp' ? 'Host:Port' : (monitorType === 'heartbeat' ? 'Slug' : 'Domain')),
        targetValue: target,
        color: isDown ? '#DC2626' : '#16A34A', // Red-600 : Green-600
        colorInt: isDown ? 14427686 : 1483594, // Discord colors
        timestamp: new Date().toISOString()
    };

    // 3. Type-Specific Fields
    const fields = [
        { name: 'Monitor', value: monitor.name, inline: true },
        { name: info.targetLabel, value: info.targetValue, inline: true },
        { name: 'Status', value: info.status, inline: true }
    ];

    if (isDown) {
        let reason = incident.reason || 'No specific error provided';
        
        // Enhance reason based on type
        if (monitorType === 'ssl') reason = incident.reason === 'expired' ? 'Certificate has EXPIRED' : `Certificate expiring soon (${incident.daysRemaining} days left)`;
        else if (monitorType === 'domain') reason = `Domain expiring soon (${incident.daysRemaining} days left)`;
        else if (monitorType === 'dns' && incident.changes) {
            reason = `DNS Changes Detected:\n` + incident.changes.map(c => `• ${c.type} changed`).join('\n');
        }

        fields.push({ name: 'Reason', value: reason, inline: false });
    } else {
        // Recovery Info
        const duration = incident.duration !== undefined ? `${incident.duration} minutes` : 'Unknown duration';
        fields.push({ name: 'Downtime', value: duration, inline: true });
    }

    return { ...info, fields };
};

module.exports = { formatAlert };
