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
  // await resend.emails.send({ from: 'MonitorP <alerts@monitorp.com>', to, subject, html });

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
      <p>Check your MonitorP dashboard for full details.</p>
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
      <p>Check your MonitorP dashboard for full details.</p>
    </div>
  `;
  return sendEmail({ to: sslMonitor.alertEmail || user.email, subject, html });
};

module.exports = { sendAlertEmail, sendRecoveryEmail, sendHeartbeatAlertEmail, sendHeartbeatRecoveryEmail, sendSslExpiryWarning, sendSslExpiredAlert };
