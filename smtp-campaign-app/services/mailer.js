const nodemailer = require('nodemailer');
const EventEmitter = require('events');

/**
 * Normalizes contact data to extract first name, last name, email, company, and custom fields.
 */
function normalizeContact(raw) {
  const contact = {};

  // Normalize keys to lowercase for lookups
  const lowerMap = {};
  for (const [key, value] of Object.entries(raw)) {
    const val = value !== undefined && value !== null ? String(value).trim() : '';
    lowerMap[key.toLowerCase().replace(/[^a-z0-9]/g, '')] = val;
    contact[key] = val;
  }

  // 1. Email discovery
  contact.email =
    lowerMap['email'] ||
    lowerMap['emailaddress'] ||
    lowerMap['e-mail'] ||
    lowerMap['mail'] ||
    contact.email ||
    '';

  // 2. Full Name
  const fullName =
    lowerMap['fullname'] ||
    lowerMap['name'] ||
    lowerMap['pocname'] ||
    lowerMap['contactname'] ||
    '';

  // 3. First Name
  let firstName =
    lowerMap['firstname'] ||
    lowerMap['first'] ||
    lowerMap['fname'] ||
    lowerMap['givenname'] ||
    '';

  // 4. Last Name
  let lastName =
    lowerMap['lastname'] ||
    lowerMap['last'] ||
    lowerMap['lname'] ||
    lowerMap['surname'] ||
    '';

  // If first name not provided but full name is, split full name
  if (!firstName && fullName) {
    const cleanedFullName = fullName.trim().replace(/^(dr|mr|mrs|ms|prof|dr\.|mr\.|mrs\.|ms\.|prof\.)\s+/i, '');
    const parts = cleanedFullName.trim().split(/\s+/);
    firstName = parts[0] || '';
    if (parts.length > 1) {
      lastName = parts.slice(1).join(' ');
    }
  }

  contact.first_name = firstName;
  contact.last_name = lastName;
  contact.name = fullName || (firstName ? `${firstName} ${lastName}`.trim() : '');

  // 5. Company / Organization
  contact.company =
    lowerMap['company'] ||
    lowerMap['companyname'] ||
    lowerMap['organization'] ||
    lowerMap['business'] ||
    lowerMap['account'] ||
    '';

  // 6. Title / Position
  contact.position =
    lowerMap['position'] ||
    lowerMap['title'] ||
    lowerMap['jobtitle'] ||
    lowerMap['role'] ||
    lowerMap['designation'] ||
    '';

  return contact;
}

/**
 * Interpolates variables in a template string (subject or body).
 * Supports {{first_name}}, {{last_name}}, {{name}}, {{company}}, {{position}}, {{email}},
 * as well as custom fields and default fallbacks: {{first_name | there}}.
 */
function renderTemplate(template, contactData) {
  if (!template) return '';
  const normalized = normalizeContact(contactData);

  // Regex to match {{ variable }} or {{ variable | fallback }}
  return template.replace(/\{\{\s*([a-zA-Z0-9_\-]+)(?:\s*\|\s*([^}]+))?\s*\}\}/g, (match, key, fallback) => {
    const cleanKey = key.trim().toLowerCase();
    const cleanFallback = fallback ? fallback.trim() : '';

    // Check direct normalized fields
    if (cleanKey === 'first_name' || cleanKey === 'firstname' || cleanKey === 'fname') {
      return normalized.first_name || cleanFallback || 'there';
    }
    if (cleanKey === 'last_name' || cleanKey === 'lastname' || cleanKey === 'lname') {
      return normalized.last_name || cleanFallback || '';
    }
    if (cleanKey === 'name' || cleanKey === 'fullname') {
      return normalized.name || cleanFallback || normalized.first_name || 'Friend';
    }
    if (cleanKey === 'email') {
      return normalized.email || cleanFallback || '';
    }
    if (cleanKey === 'company' || cleanKey === 'company_name') {
      return normalized.company || cleanFallback || '';
    }
    if (cleanKey === 'position' || cleanKey === 'title' || cleanKey === 'role') {
      return normalized.position || cleanFallback || '';
    }

    // Check custom contact fields (case-insensitive)
    for (const [prop, val] of Object.entries(contactData)) {
      if (prop.toLowerCase() === cleanKey) {
        return val ? String(val) : cleanFallback;
      }
    }

    return cleanFallback || match;
  });
}

/**
 * Creates and verifies a Nodemailer SMTP transporter.
 */
function createTransporter(smtpConfig) {
  const { host, port, secure, user, pass } = smtpConfig;

  const transportOptions = {
    host: host.trim(),
    port: parseInt(port, 10),
    secure: secure === true || secure === 'true' || parseInt(port, 10) === 465,
    auth: {
      user: user.trim(),
      pass: pass.trim(),
    },
    // Modern TLS settings
    tls: {
      rejectUnauthorized: false, // Prevents self-signed cert blocks on custom corporate hosts
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  };

  return nodemailer.createTransport(transportOptions);
}

/**
 * Tests connection & login credentials with the target SMTP server.
 */
async function verifySmtp(smtpConfig) {
  try {
    const transporter = createTransporter(smtpConfig);
    await transporter.verify();
    return {
      success: true,
      message: 'SMTP authentication and connection successful!',
    };
  } catch (err) {
    let friendlyMessage = err.message || 'SMTP Connection failed.';

    if (
      friendlyMessage.includes('534-5.7.9') ||
      friendlyMessage.includes('Application-specific password required') ||
      friendlyMessage.includes('InvalidSecondFactor')
    ) {
      friendlyMessage =
        'Google App Password Required: Google does not allow using your regular account password for SMTP. Generate a 16-character App Password at https://myaccount.google.com/apppasswords and paste it here.';
    } else if (err.code === 'EAUTH') {
      friendlyMessage =
        'Authentication failed. Invalid username or password. If using Gmail, Google Workspace, or Yahoo, make sure to generate an App Password.';
    } else if (err.code === 'ESOCKET' || err.code === 'ETIMEDOUT') {
      friendlyMessage = `Could not connect to ${smtpConfig.host}:${smtpConfig.port}. Check if port or security (SSL/TLS) needs to be toggled.`;
    } else if (err.code === 'EENVELOPE') {
      friendlyMessage = 'Sender or recipient address rejected by SMTP server.';
    }

    return {
      success: false,
      code: err.code || 'SMTP_ERROR',
      message: friendlyMessage,
      rawError: err.message,
    };
  }
}

/**
 * Sends a single test email.
 */
async function sendTestEmail({ smtpConfig, senderName, toEmail, subject, bodyHtml, sampleContact = {} }) {
  const transporter = createTransporter(smtpConfig);

  const personalizedSubject = renderTemplate(subject, sampleContact);
  const personalizedHtml = renderTemplate(bodyHtml, sampleContact);

  const fromAddress = senderName ? `"${senderName}" <${smtpConfig.user}>` : smtpConfig.user;

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: personalizedSubject,
    html: personalizedHtml,
    text: personalizedHtml.replace(/<[^>]+>/g, ' '), // Plain text fallback
  };

  const info = await transporter.sendMail(mailOptions);
  return {
    success: true,
    messageId: info.messageId,
    previewSubject: personalizedSubject,
  };
}

/**
 * Manages active email campaign execution with throttling, pause/resume, and real-time SSE progress.
 */
class CampaignManager extends EventEmitter {
  constructor() {
    super();
    this.reset();
  }

  reset() {
    this.campaignId = null;
    this.status = 'idle'; // idle | running | paused | stopped | completed
    this.smtpConfig = null;
    this.senderName = '';
    this.subjectTemplate = '';
    this.bodyTemplate = '';
    this.delayMs = 2000; // 2 seconds between emails by default
    this.recipients = [];
    this.currentIndex = 0;
    this.sentCount = 0;
    this.failedCount = 0;
    this.timer = null;
    this.logs = [];
  }

  startCampaign({ smtpConfig, senderName, subject, body, recipients, delayMs = 2000 }) {
    if (this.status === 'running') {
      throw new Error('A campaign is already currently running.');
    }

    this.campaignId = 'camp_' + Date.now();
    this.status = 'running';
    this.smtpConfig = smtpConfig;
    this.senderName = senderName || '';
    this.subjectTemplate = subject;
    this.bodyTemplate = body;
    this.delayMs = Math.max(500, parseInt(delayMs, 10) || 2000);

    // Initialize recipients
    this.recipients = recipients.map((r, idx) => {
      const normalized = normalizeContact(r);
      return {
        id: idx + 1,
        ...normalized,
        status: 'pending', // pending | sending | sent | failed
        error: null,
        sentAt: null,
        messageId: null,
      };
    });

    this.currentIndex = 0;
    this.sentCount = 0;
    this.failedCount = 0;
    this.logs = [];

    this.emitUpdate();
    this.processNext();

    return {
      campaignId: this.campaignId,
      totalRecipients: this.recipients.length,
      status: this.status,
    };
  }

  pauseCampaign() {
    if (this.status === 'running') {
      this.status = 'paused';
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      this.emitUpdate();
      return { status: this.status };
    }
    return { status: this.status, error: 'Campaign is not currently running.' };
  }

  resumeCampaign() {
    if (this.status === 'paused') {
      this.status = 'running';
      this.emitUpdate();
      this.processNext();
      return { status: this.status };
    }
    return { status: this.status, error: 'Campaign is not paused.' };
  }

  stopCampaign() {
    this.status = 'stopped';
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.emitUpdate();
    return { status: this.status };
  }

  async processNext() {
    if (this.status !== 'running') return;

    if (this.currentIndex >= this.recipients.length) {
      this.status = 'completed';
      this.emitUpdate();
      this.emit('completed', this.getStatusSummary());
      return;
    }

    const recipient = this.recipients[this.currentIndex];
    recipient.status = 'sending';
    this.emitUpdate();

    try {
      if (!recipient.email || !recipient.email.includes('@')) {
        throw new Error('Invalid email address.');
      }

      const transporter = createTransporter(this.smtpConfig);
      const subject = renderTemplate(this.subjectTemplate, recipient);
      const html = renderTemplate(this.bodyTemplate, recipient);
      const fromAddress = this.senderName
        ? `"${this.senderName}" <${this.smtpConfig.user}>`
        : this.smtpConfig.user;

      const info = await transporter.sendMail({
        from: fromAddress,
        to: recipient.email,
        subject,
        html,
        text: html.replace(/<[^>]+>/g, ' '),
      });

      recipient.status = 'sent';
      recipient.sentAt = new Date().toISOString();
      recipient.messageId = info.messageId;
      this.sentCount++;
    } catch (err) {
      recipient.status = 'failed';
      let rawMsg = err.message || 'Delivery failed';
      if (
        rawMsg.includes('534-5.7.9') ||
        rawMsg.includes('Application-specific password required') ||
        rawMsg.includes('InvalidSecondFactor')
      ) {
        recipient.error = 'Google App Password Required: Standard Gmail passwords are not allowed for SMTP. Generate a 16-character App Password at https://myaccount.google.com/apppasswords and enter it in Step 1.';
        recipient.isGoogleAuthError = true;
      } else {
        recipient.error = rawMsg;
      }
      this.failedCount++;
    }

    this.currentIndex++;
    this.emitUpdate();

    // Schedule next send after delay
    if (this.status === 'running') {
      this.timer = setTimeout(() => {
        this.processNext();
      }, this.delayMs);
    }
  }

  emitUpdate() {
    const summary = this.getStatusSummary();
    this.emit('progress', summary);
  }

  getStatusSummary() {
    const total = this.recipients.length;
    const processed = this.sentCount + this.failedCount;
    const progressPercent = total > 0 ? Math.round((processed / total) * 100) : 0;

    return {
      campaignId: this.campaignId,
      status: this.status,
      total,
      currentIndex: this.currentIndex,
      sentCount: this.sentCount,
      failedCount: this.failedCount,
      progressPercent,
      delayMs: this.delayMs,
      recipients: this.recipients,
    };
  }
}

const campaignManager = new CampaignManager();

module.exports = {
  verifySmtp,
  renderTemplate,
  normalizeContact,
  sendTestEmail,
  campaignManager,
};
