const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMARTLIGHT_ALERT_EMAIL = process.env.SMARTLIGHT_ALERT_EMAIL || '';

let transporter = null;

const buildTransporter = () => {
  if (!SMTP_USER || !SMTP_PASS || !SMARTLIGHT_ALERT_EMAIL) {
    return null;
  }

  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  return transporter;
};

const sendSmartLightAlertEmail = async (alert) => {
  if (!SMTP_USER || !SMTP_PASS || !SMARTLIGHT_ALERT_EMAIL) {
    return {
      sent: false,
      skipped: true,
      reason: 'SMTP not configured (missing SMTP_USER, SMTP_PASS, or SMARTLIGHT_ALERT_EMAIL)'
    };
  }

  const transport = buildTransporter();
  if (!transport) {
    return {
      sent: false,
      skipped: true,
      reason: 'SMTP transporter could not be created'
    };
  }

  const isCritical = alert.priorityLevel === 'CRITICAL';
  const subject = `CivicResolve SmartLight Alert: ${alert.priorityLevel} - ${alert.streetlightId}`;

  const streetlightName = alert.streetlightName || '--';
  const areaName = alert.areaName || '--';
  const faultType = alert.faultType ? alert.faultType.replace('_', ' ') : '--';
  const priorityScore = alert.priorityScore ?? '--';
  const priorityLevel = alert.priorityLevel || '--';
  const status = alert.status || 'DETECTED';
  const detectionTime = alert.createdAt ? new Date(alert.createdAt).toLocaleString() : '--';
  const occurrenceCount = alert.occurrenceCount !== undefined ? alert.occurrenceCount : '--';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; }
        .header { background: ${isCritical ? '#7f1d1d' : '#dc2626'}; color: white; padding: 16px; border-radius: 6px 6px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 18px; }
        .content { padding: 20px; background: #ffffff; }
        .section { margin-bottom: 16px; }
        .section-title { font-size: 14px; font-weight: bold; color: #1e293b; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .field { margin-bottom: 6px; }
        .field-label { font-weight: bold; color: #475569; }
        .field-value { margin-left: 8px; }
        .footer { padding: 16px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; color: white; font-size: 12px; font-weight: bold; }
        .badge-critical { background: #7f1d1d; }
        .badge-high { background: #dc2626; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CivicResolve SmartLight Alert</h1>
        </div>
        <div class="content">
          <div class="section">
            <div class="section-title">Streetlight</div>
            <div class="field"><span class="field-label">ID:</span> <span class="field-value">${alert.streetlightId}</span></div>
            <div class="field"><span class="field-label">Name:</span> <span class="field-value">${streetlightName}</span></div>
            <div class="field"><span class="field-label">Area:</span> <span class="field-value">${areaName}</span></div>
          </div>
          <div class="section">
            <div class="section-title">Fault</div>
            <div class="field"><span class="field-label">Type:</span> <span class="field-value">${faultType}</span></div>
            <div class="field"><span class="field-label">Priority Level:</span> <span class="field-value"><span class="badge ${isCritical ? 'badge-critical' : 'badge-high'}">${priorityLevel}</span></span></div>
            <div class="field"><span class="field-label">Priority Score:</span> <span class="field-value">${priorityScore}</span></div>
            <div class="field"><span class="field-label">Status:</span> <span class="field-value">${status}</span></div>
            <div class="field"><span class="field-label">Detection Time:</span> <span class="field-value">${detectionTime}</span></div>
            <div class="field"><span class="field-label">Occurrence Count:</span> <span class="field-value">${occurrenceCount}</span></div>
          </div>
          <div class="section">
            <div class="section-title">Action Required</div>
            <div class="field-value">This streetlight requires municipal attention. Please review the fault in the CivicResolve SmartLight dashboard and assign maintenance as needed.</div>
          </div>
        </div>
        <div class="footer">
          CivicResolve SmartLight Monitoring System<br>
          This is an automated alert. Do not reply to this email.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
CivicResolve SmartLight Alert

Streetlight:
- ID: ${alert.streetlightId}
- Name: ${streetlightName}
- Area: ${areaName}

Fault:
- Type: ${faultType}
- Priority Level: ${priorityLevel}
- Priority Score: ${priorityScore}
- Status: ${status}
- Detection Time: ${detectionTime}
- Occurrence Count: ${occurrenceCount}

Action Required:
This streetlight requires municipal attention. Please review the fault in the CivicResolve SmartLight dashboard and assign maintenance as needed.

CivicResolve SmartLight Monitoring System
This is an automated alert. Do not reply to this email.
`;

  const mailOptions = {
    from: `"CivicResolve SmartLight" <${SMTP_USER}>`,
    to: SMARTLIGHT_ALERT_EMAIL,
    subject: subject,
    text: text,
    html: html
  };

  const info = await transport.sendMail(mailOptions);

  return {
    sent: true,
    messageId: info.messageId,
    response: info.response
  };
};

module.exports = {
  sendSmartLightAlertEmail,
  buildTransporter
};
