/**
 * Simple Mailer Utility
 * In production, this would use Resend or Nodemailer.
 * For now, we'll log to console and provide a hook for real emails.
 */

const sendEmail = async ({ to, subject, html }) => {
  console.log('--------------------------------------------------');
  console.log(`SENDING EMAIL TO: ${to}`);
  console.log(`SUBJECT: ${subject}`);
  console.log(`BODY: ${html.substring(0, 100)}...`);
  console.log('--------------------------------------------------');

  // TO INTEGRATE RESEND:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({ from: 'PingForge <alerts@pingforge.com>', to, subject, html });

  return true;
};

const sendAlertEmail = async (user, api, incident) => {
  const subject = `🚨 ALERT: ${api.name} is DOWN`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #ef4444;">Your API is Down</h2>
      <p>Hello ${user.fullName},</p>
      <p>We detected that <strong>${api.name}</strong> (${api.url}) went down at <strong>${incident.startTime.toLocaleString()}</strong>.</p>
      <p><strong>Reason:</strong> ${incident.reason}</p>
      <hr />
      <p>Check your dashboard for more details.</p>
    </div>
  `;

  return sendEmail({ to: api.alertEmail || user.email, subject, html });
};

const sendRecoveryEmail = async (user, api, incident) => {
  const subject = `✅ RECOVERY: ${api.name} is back UP`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #10b981;">Your API has Recovered</h2>
      <p>Hello ${user.fullName},</p>
      <p>Good news! <strong>${api.name}</strong> (${api.url}) is back online as of <strong>${incident.endTime.toLocaleString()}</strong>.</p>
      <p>The downtime lasted for <strong>${incident.duration} minutes</strong>.</p>
      <hr />
      <p>All systems are now normal.</p>
    </div>
  `;

  return sendEmail({ to: api.alertEmail || user.email, subject, html });
};

const sendHeartbeatAlertEmail = async (user, heartbeat, incident) => {
  const subject = `🚨 ALERT: Heartbeat Missed - ${heartbeat.name}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #ef4444;">Heartbeat Missed</h2>
      <p>Hello ${user.fullName},</p>
      <p>Your scheduled heartbeat <strong>${heartbeat.name}</strong> missed its expected ping at <strong>${incident.missedAt.toLocaleString()}</strong>.</p>
      <p><strong>Expected Every:</strong> ${heartbeat.expectedEvery} ${heartbeat.expectedEveryUnit}</p>
      <hr />
      <p>Please check your job/server immediately.</p>
    </div>
  `;

  return sendEmail({ to: heartbeat.alertEmail || user.email, subject, html });
};

const sendHeartbeatRecoveryEmail = async (user, heartbeat, incident) => {
  const subject = `✅ RECOVERY: Heartbeat Restored - ${heartbeat.name}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #10b981;">Heartbeat Restored</h2>
      <p>Hello ${user.fullName},</p>
      <p>Your heartbeat <strong>${heartbeat.name}</strong> has resumed pings as of <strong>${incident.resolvedAt.toLocaleString()}</strong>.</p>
      <p>The job was silent for <strong>${incident.duration} minutes</strong>.</p>
      <hr />
      <p>Monitoring has returned to normal.</p>
    </div>
  `;

  return sendEmail({ to: heartbeat.alertEmail || user.email, subject, html });
};

const sendSslExpiryWarning = async (user, sslMonitor, daysRemaining) => {
  const urgency = daysRemaining <= 7 ? 'CRITICAL' : daysRemaining <= 15 ? 'URGENT' : 'WARNING';
  const subject = `🔒 SSL ${urgency}: ${sslMonitor.domain} expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`;
  const color = daysRemaining <= 7 ? '#ef4444' : daysRemaining <= 15 ? '#f59e0b' : '#3b82f6';
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2 style="color: ${color};">SSL Certificate Expiring Soon</h2>
      <p>Hello ${user.fullName},</p>
      <p>The SSL certificate for <strong>${sslMonitor.domain}</strong> will expire in <strong>${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</strong>.</p>
      <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <tr><td style="padding: 6px 12px; font-weight: bold;">Domain</td><td style="padding: 6px 12px;">${sslMonitor.domain}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding: 6px 12px; font-weight: bold;">Issuer</td><td style="padding: 6px 12px;">${sslMonitor.issuer || 'Unknown'}</td></tr>
        <tr><td style="padding: 6px 12px; font-weight: bold;">Expires</td><td style="padding: 6px 12px;">${sslMonitor.validTo ? new Date(sslMonitor.validTo).toLocaleDateString() : 'Unknown'}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding: 6px 12px; font-weight: bold;">Days Left</td><td style="padding: 6px 12px; color: ${color}; font-weight: bold;">${daysRemaining}</td></tr>
      </table>
      <p>Please renew your SSL certificate immediately to avoid security warnings on your site.</p>
      <hr />
      <p>Check your PingForge dashboard for full details.</p>
    </div>
  `;
  return sendEmail({ to: sslMonitor.alertEmail || user.email, subject, html });
};

const sendSslExpiredAlert = async (user, sslMonitor) => {
  const subject = `🚨 SSL EXPIRED: ${sslMonitor.domain} certificate has expired!`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #ef4444;">SSL Certificate EXPIRED</h2>
      <p>Hello ${user.fullName},</p>
      <p>The SSL certificate for <strong>${sslMonitor.domain}</strong> has <strong>expired</strong>. Visitors are now seeing a browser security warning.</p>
      <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <tr><td style="padding: 6px 12px; font-weight: bold;">Domain</td><td style="padding: 6px 12px;">${sslMonitor.domain}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding: 6px 12px; font-weight: bold;">Issuer</td><td style="padding: 6px 12px;">${sslMonitor.issuer || 'Unknown'}</td></tr>
        <tr><td style="padding: 6px 12px; font-weight: bold;">Expired On</td><td style="padding: 6px 12px; color: #ef4444; font-weight: bold;">${sslMonitor.validTo ? new Date(sslMonitor.validTo).toLocaleDateString() : 'Unknown'}</td></tr>
      </table>
      <p style="color: #ef4444; font-weight: bold;">ACTION REQUIRED: Renew this certificate immediately!</p>
      <hr />
      <p>Check your PingForge dashboard for full details.</p>
    </div>
  `;
  return sendEmail({ to: sslMonitor.alertEmail || user.email, subject, html });
};

// ─── TCP Port Monitor Alerts ──────────────────────────────────────────────────

const sendTcpDownAlert = async (user, monitor, reason) => {
  const subject = `🔴 Port Alert — ${monitor.name} (${monitor.host}:${monitor.port}) is DOWN`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #ef4444;">TCP Port is DOWN</h2>
      <p>Hello ${user.fullName},</p>
      <p>We could not reach <strong>${monitor.host}:${monitor.port}</strong> (${monitor.name}).</p>
      <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <tr><td style="padding: 6px 12px; font-weight: bold;">Host</td><td style="padding: 6px 12px;">${monitor.host}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding: 6px 12px; font-weight: bold;">Port</td><td style="padding: 6px 12px;">${monitor.port}</td></tr>
        <tr><td style="padding: 6px 12px; font-weight: bold;">Reason</td><td style="padding: 6px 12px; color: #ef4444;">${reason || 'Unknown error'}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding: 6px 12px; font-weight: bold;">Detected At</td><td style="padding: 6px 12px;">${new Date().toLocaleString()}</td></tr>
      </table>
      <p>Check your server and service immediately.</p>
      <hr /><p>PingForge — TCP Port Monitoring</p>
    </div>
  `;
  return sendEmail({ to: monitor.alertEmail || user.email, subject, html });
};

const sendTcpRecoveryAlert = async (user, monitor, responseTime) => {
  const subject = `✅ Port Recovered — ${monitor.name} (${monitor.host}:${monitor.port}) is UP`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #10b981;">TCP Port Recovered</h2>
      <p>Hello ${user.fullName},</p>
      <p><strong>${monitor.host}:${monitor.port}</strong> (${monitor.name}) is back online.</p>
      <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <tr><td style="padding: 6px 12px; font-weight: bold;">Host</td><td style="padding: 6px 12px;">${monitor.host}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding: 6px 12px; font-weight: bold;">Port</td><td style="padding: 6px 12px;">${monitor.port}</td></tr>
        <tr><td style="padding: 6px 12px; font-weight: bold;">Response Time</td><td style="padding: 6px 12px; color: #10b981;">${responseTime ? responseTime + 'ms' : 'N/A'}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding: 6px 12px; font-weight: bold;">Recovered At</td><td style="padding: 6px 12px;">${new Date().toLocaleString()}</td></tr>
      </table>
      <p>All systems are back to normal.</p>
      <hr /><p>PingForge — TCP Port Monitoring</p>
    </div>
  `;
  return sendEmail({ to: monitor.alertEmail || user.email, subject, html });
};

// ─── DNS Monitor Alerts ───────────────────────────────────────────────────────

const sendDnsChangeAlert = async (user, monitor, changes, currentRecords) => {
  const subject = `⚠️ DNS Change Detected — ${monitor.domain}`;
  const changesHtml = changes.map(c => `
    <tr>
      <td style="padding: 8px 12px; font-weight: bold;">${c.type} Record</td>
      <td style="padding: 8px 12px; color: #6b7280;">${JSON.stringify(c.oldVal)}</td>
      <td style="padding: 8px 12px; color: #ef4444; font-weight: bold;">${JSON.stringify(c.newVal)} ← CHANGED</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #f59e0b;">⚠️ DNS Record Change Detected</h2>
      <p>Hello ${user.fullName},</p>
      <p>DNS records for <strong>${monitor.domain}</strong> have changed from your baseline.</p>
      <p><strong>Detected At:</strong> ${new Date().toLocaleString()}</p>
      <h3>Changes Detected:</h3>
      <table style="border-collapse: collapse; width: 100%; margin: 16px 0; border: 1px solid #e5e7eb;">
        <thead style="background: #f9fafb;">
          <tr>
            <th style="padding: 8px 12px; text-align: left;">Record Type</th>
            <th style="padding: 8px 12px; text-align: left;">Was (Baseline)</th>
            <th style="padding: 8px 12px; text-align: left;">Now (Live)</th>
          </tr>
        </thead>
        <tbody>${changesHtml}</tbody>
      </table>
      <p style="color: #6b7280;">If this was intentional → update your baseline in the PingForge dashboard.</p>
      <p style="color: #ef4444; font-weight: bold;">If this was NOT intentional → check your DNS provider immediately. This could indicate misconfiguration or unauthorized access.</p>
      <hr /><p>PingForge — DNS Monitoring</p>
    </div>
  `;
  return sendEmail({ to: monitor.alertEmail || user.email, subject, html });
};

const sendDnsFailureAlert = async (user, monitor, reason) => {
  const subject = `🔴 DNS Resolution Failed — ${monitor.domain}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #ef4444;">DNS Resolution Failed</h2>
      <p>Hello ${user.fullName},</p>
      <p>We could not resolve DNS records for <strong>${monitor.domain}</strong>.</p>
      <p><strong>Reason:</strong> <span style="color: #ef4444;">${reason}</span></p>
      <p><strong>Detected At:</strong> ${new Date().toLocaleString()}</p>
      <p>Please check your domain and DNS provider immediately.</p>
      <hr /><p>PingForge — DNS Monitoring</p>
    </div>
  `;
  return sendEmail({ to: monitor.alertEmail || user.email, subject, html });
};

// ─── Domain Expiry Alerts ─────────────────────────────────────────────────────

const sendDomainExpiryAlert = async (user, monitor, daysRemaining, alertLevel) => {
  const configs = {
    days60:  { emoji: '📅', urgency: 'INFO',     color: '#10b981', subject: `📅 Domain expires in 60 days — renewal reminder` },
    days30:  { emoji: '⚠️', urgency: 'WARNING',  color: '#f59e0b', subject: `⚠️ Domain expires in 30 days — action needed` },
    days15:  { emoji: '🚨', urgency: 'URGENT',   color: '#f97316', subject: `🚨 Domain expires in 15 days — renew now` },
    days7:   { emoji: '🔴', urgency: 'CRITICAL', color: '#ef4444', subject: `🔴 Domain expires in 7 DAYS — CRITICAL` },
    days3:   { emoji: '🔴', urgency: 'CRITICAL', color: '#ef4444', subject: `🔴 Domain expires in 3 DAYS — RENEW IMMEDIATELY` },
    days1:   { emoji: '🔴', urgency: 'CRITICAL', color: '#ef4444', subject: `🔴 Domain expires TOMORROW — LAST WARNING` },
    expired: { emoji: '💀', urgency: 'EXPIRED',  color: '#7f1d1d', subject: `💀 Domain EXPIRED — all services may be down` },
  };

  const cfg = configs[alertLevel] || configs.days30;
  const expiryDateStr = monitor.whoisData?.expiryDate
    ? new Date(monitor.whoisData.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Unknown';

  const subject = `${cfg.subject} — ${monitor.domain}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2 style="color: ${cfg.color};">${cfg.emoji} Domain Expiry ${cfg.urgency}: ${monitor.domain}</h2>
      <p>Hello ${user.fullName},</p>
      <p>The domain registration for <strong>${monitor.domain}</strong> ${daysRemaining <= 0 ? 'has <strong>EXPIRED</strong>' : `expires in <strong>${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</strong>`}.</p>
      <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <tr><td style="padding: 6px 12px; font-weight: bold;">Domain</td><td style="padding: 6px 12px;">${monitor.domain}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding: 6px 12px; font-weight: bold;">Registrar</td><td style="padding: 6px 12px;">${monitor.whoisData?.registrar || 'Unknown'}</td></tr>
        <tr><td style="padding: 6px 12px; font-weight: bold;">Expiry Date</td><td style="padding: 6px 12px; color: ${cfg.color}; font-weight: bold;">${expiryDateStr}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding: 6px 12px; font-weight: bold;">Days Remaining</td><td style="padding: 6px 12px; color: ${cfg.color}; font-weight: bold;">${daysRemaining <= 0 ? 'EXPIRED' : daysRemaining}</td></tr>
      </table>
      <p style="color: ${cfg.color}; font-weight: bold;">Action required: Renew your domain registration as soon as possible to avoid service disruption.</p>
      <p style="color: #6b7280; font-size: 12px;">When a domain expires, all associated websites, APIs, and email addresses stop working immediately.</p>
      <hr /><p>PingForge — Domain Expiry Monitoring</p>
    </div>
  `;
  return sendEmail({ to: monitor.alertEmail || user.email, subject, html });
};
const transporter = {
  sendMail: async ({ to, subject, html }) => {
    return sendEmail({ to, subject, html });
  }
};

module.exports = {
  transporter,
  sendAlertEmail,
  sendRecoveryEmail,
  sendHeartbeatAlertEmail,
  sendHeartbeatRecoveryEmail,
  sendSslExpiryWarning,
  sendSslExpiredAlert,
  sendTcpDownAlert,
  sendTcpRecoveryAlert,
  sendDnsChangeAlert,
  sendDnsFailureAlert,
  sendDomainExpiryAlert,
};
