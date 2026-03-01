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

module.exports = { sendAlertEmail, sendRecoveryEmail, sendHeartbeatAlertEmail, sendHeartbeatRecoveryEmail };
