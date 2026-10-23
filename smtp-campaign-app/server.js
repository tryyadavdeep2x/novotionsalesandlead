const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const xlsx = require('xlsx');
const { autoDiscoverEmailSettings } = require('./services/autodiscover');
const {
  verifySmtp,
  renderTemplate,
  normalizeContact,
  sendTestEmail,
  campaignManager,
} = require('./services/mailer');
const { testAiKey, generateWithAgent } = require('./services/ai_agent');

const app = express();
const PORT = process.env.PORT || 5050;

// In-memory upload for Excel and CSV
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// -------------------------------------------------------------
// 1. AUTO-DISCOVER SMTP, IMAP & POP CONFIGURATION
// -------------------------------------------------------------
app.get('/api/autodiscover', async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email query parameter is required.' });
  }

  try {
    const config = await autoDiscoverEmailSettings(email);
    res.json({ success: true, ...config });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message || 'Auto-discovery failed.' });
  }
});

// -------------------------------------------------------------
// 2. VERIFY SMTP CREDENTIALS
// -------------------------------------------------------------
app.post('/api/verify-smtp', async (req, res) => {
  const { host, port, secure, user, pass } = req.body;

  if (!host || !port || !user || !pass) {
    return res.status(400).json({
      success: false,
      error: 'Host, port, username (email), and password are all required.',
    });
  }

  try {
    const result = await verifySmtp({ host, port, secure, user, pass });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 3. UPLOAD & PARSE RECIPIENTS (EXCEL .xlsx/.xls OR CSV)
// -------------------------------------------------------------
app.post('/api/upload-recipients', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded.' });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'The uploaded spreadsheet is empty or has no recognizable rows.',
      });
    }

    // Discover all column headers
    const columns = Object.keys(rawRows[0] || {});

    // Normalize contacts
    const contacts = rawRows
      .map((row, idx) => {
        const contact = normalizeContact(row);
        return {
          id: idx + 1,
          ...contact,
        };
      })
      .filter((c) => c.email && c.email.includes('@')); // Only include rows with valid emails

    res.json({
      success: true,
      filename: req.file.originalname,
      totalRows: rawRows.length,
      validContacts: contacts.length,
      columns,
      contacts,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to parse Excel file: ' + err.message });
  }
});

// -------------------------------------------------------------
// 4. PARSE RAW CONTACTS (MANUAL PASTE / DIRECT JSON)
// -------------------------------------------------------------
app.post('/api/parse-raw-contacts', (req, res) => {
  const { contacts } = req.body;
  if (!Array.isArray(contacts)) {
    return res.status(400).json({ success: false, error: 'contacts array is required.' });
  }

  const normalized = contacts
    .map((item, idx) => ({
      id: idx + 1,
      ...normalizeContact(item),
    }))
    .filter((c) => c.email && c.email.includes('@'));

  res.json({
    success: true,
    total: normalized.length,
    contacts: normalized,
  });
});

// -------------------------------------------------------------
// 5. DOWNLOAD SAMPLE EXCEL TEMPLATE
// -------------------------------------------------------------
app.get('/api/sample-template', (req, res) => {
  const sampleData = [
    {
      'First Name': 'Sarah',
      'Last Name': 'Jenkins',
      Email: 'sarah.jenkins@example.com',
      Company: 'St. Jude Medical Group',
      Position: 'Clinical Director',
    },
    {
      'First Name': 'David',
      'Last Name': 'Miller',
      Email: 'david.miller@example.com',
      Company: 'Apex Healthcare UK',
      Position: 'Chief Executive Officer',
    },
    {
      'First Name': 'Elena',
      'Last Name': 'Rostova',
      Email: 'elena.rostova@example.com',
      Company: 'BioTech Diagnostics USA',
      Position: 'VP of Procurement',
    },
    {
      'First Name': 'Marcus',
      'Last Name': 'Vance',
      Email: 'marcus.vance@example.com',
      Company: 'Harley Health Partners',
      Position: 'Medical Director',
    },
  ];

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(sampleData);
  xlsx.utils.book_append_sheet(wb, ws, 'Recipients');
  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', 'attachment; filename="recipients_sample_template.xlsx"');
  res.send(buffer);
});

// -------------------------------------------------------------
// 6. SEND TEST EMAIL
// -------------------------------------------------------------
app.post('/api/test-email', async (req, res) => {
  const { smtpConfig, senderName, toEmail, subject, bodyHtml, sampleContact } = req.body;

  if (!smtpConfig || !toEmail || !subject || !bodyHtml) {
    return res.status(400).json({
      success: false,
      error: 'smtpConfig, toEmail, subject, and bodyHtml are required.',
    });
  }

  try {
    const result = await sendTestEmail({
      smtpConfig,
      senderName,
      toEmail,
      subject,
      bodyHtml,
      sampleContact: sampleContact || {},
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 7. CAMPAIGN DISPATCH CONTROLS
// -------------------------------------------------------------
app.post('/api/campaign/start', (req, res) => {
  const { smtpConfig, senderName, subject, body, recipients, delayMs } = req.body;

  if (!smtpConfig || !subject || !body || !recipients || recipients.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Missing required campaign parameters (smtpConfig, subject, body, recipients).',
    });
  }

  try {
    const result = campaignManager.startCampaign({
      smtpConfig,
      senderName,
      subject,
      body,
      recipients,
      delayMs: delayMs || 2000,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/campaign/pause', (req, res) => {
  const result = campaignManager.pauseCampaign();
  res.json({ success: true, ...result });
});

app.post('/api/campaign/resume', (req, res) => {
  const result = campaignManager.resumeCampaign();
  res.json({ success: true, ...result });
});

app.post('/api/campaign/stop', (req, res) => {
  const result = campaignManager.stopCampaign();
  res.json({ success: true, ...result });
});

app.get('/api/campaign/status', (req, res) => {
  res.json({ success: true, ...campaignManager.getStatusSummary() });
});

// -------------------------------------------------------------
// 8. SERVER-SENT EVENTS (SSE) LIVE CAMPAIGN STREAM
// -------------------------------------------------------------
app.get('/api/campaign/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send immediate status
  const currentStatus = campaignManager.getStatusSummary();
  res.write(`data: ${JSON.stringify(currentStatus)}\n\n`);

  // Progress listener
  const onProgress = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  campaignManager.on('progress', onProgress);

  req.on('close', () => {
    campaignManager.off('progress', onProgress);
  });
});

// -------------------------------------------------------------
// 9. AI AGENT ROUTES (GEMINI, OPENAI, CLAUDE, GROQ, CUSTOM)
// -------------------------------------------------------------
app.post('/api/ai/test-key', async (req, res) => {
  const { provider, apiKey, model, baseUrl } = req.body;
  try {
    const result = await testAiKey({ provider, apiKey, model, baseUrl });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/ai/generate', async (req, res) => {
  const { provider, apiKey, model, baseUrl, agentType, prompt, currentDraft, tone, audienceContext } = req.body;
  try {
    const result = await generateWithAgent({
      provider,
      apiKey,
      model,
      baseUrl,
      agentType,
      prompt,
      currentDraft,
      tone,
      audienceContext,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Novotion Email Automation running at http://localhost:${PORT}`);
  console.log(`====================================================`);
});
