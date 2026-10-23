const dns = require('dns').promises;

/**
 * Well-known email providers with confirmed SMTP, IMAP, and POP configurations.
 */
const KNOWN_PROVIDERS = {
  // Google / Gmail
  'gmail.com': {
    name: 'Google Workspace / Gmail',
    type: 'google',
    smtp: { host: 'smtp.gmail.com', port: 465, secure: true, authMethod: 'LOGIN' },
    imap: { host: 'imap.gmail.com', port: 993, secure: true },
    pop: { host: 'pop.gmail.com', port: 995, secure: true },
    authGuide: 'Google requires 2-Step Verification and a 16-character App Password (go to myaccount.google.com -> Security -> 2-Step Verification -> App Passwords).',
  },
  'googlemail.com': {
    name: 'Google Workspace / Gmail',
    type: 'google',
    smtp: { host: 'smtp.gmail.com', port: 465, secure: true, authMethod: 'LOGIN' },
    imap: { host: 'imap.gmail.com', port: 993, secure: true },
    pop: { host: 'pop.gmail.com', port: 995, secure: true },
    authGuide: 'Google requires 2-Step Verification and a 16-character App Password.',
  },

  // Microsoft
  'outlook.com': {
    name: 'Microsoft Outlook / Office 365',
    type: 'microsoft',
    smtp: { host: 'smtp.office365.com', port: 587, secure: false, authMethod: 'LOGIN' },
    imap: { host: 'outlook.office365.com', port: 993, secure: true },
    pop: { host: 'outlook.office365.com', port: 995, secure: true },
    authGuide: 'Use your Microsoft account email and password (or App Password if 2FA is enabled on your Microsoft account).',
  },
  'hotmail.com': {
    name: 'Microsoft Hotmail',
    type: 'microsoft',
    smtp: { host: 'smtp.office365.com', port: 587, secure: false, authMethod: 'LOGIN' },
    imap: { host: 'outlook.office365.com', port: 993, secure: true },
    pop: { host: 'outlook.office365.com', port: 995, secure: true },
    authGuide: 'Use your Hotmail credentials or an App Password.',
  },
  'live.com': {
    name: 'Microsoft Live Mail',
    type: 'microsoft',
    smtp: { host: 'smtp.office365.com', port: 587, secure: false, authMethod: 'LOGIN' },
    imap: { host: 'outlook.office365.com', port: 993, secure: true },
    pop: { host: 'outlook.office365.com', port: 995, secure: true },
  },
  'msn.com': {
    name: 'Microsoft MSN',
    type: 'microsoft',
    smtp: { host: 'smtp.office365.com', port: 587, secure: false, authMethod: 'LOGIN' },
    imap: { host: 'outlook.office365.com', port: 993, secure: true },
    pop: { host: 'outlook.office365.com', port: 995, secure: true },
  },

  // Yahoo
  'yahoo.com': {
    name: 'Yahoo Mail',
    type: 'yahoo',
    smtp: { host: 'smtp.mail.yahoo.com', port: 465, secure: true, authMethod: 'LOGIN' },
    imap: { host: 'imap.mail.yahoo.com', port: 993, secure: true },
    pop: { host: 'pop.mail.yahoo.com', port: 995, secure: true },
    authGuide: 'Yahoo requires an App Password generated in Account Security settings.',
  },
  'yahoo.co.uk': {
    name: 'Yahoo Mail UK',
    type: 'yahoo',
    smtp: { host: 'smtp.mail.yahoo.com', port: 465, secure: true, authMethod: 'LOGIN' },
    imap: { host: 'imap.mail.yahoo.com', port: 993, secure: true },
    pop: { host: 'pop.mail.yahoo.com', port: 995, secure: true },
    authGuide: 'Yahoo requires an App Password generated in Account Security settings.',
  },
  'ymail.com': {
    name: 'Yahoo Mail',
    type: 'yahoo',
    smtp: { host: 'smtp.mail.yahoo.com', port: 465, secure: true, authMethod: 'LOGIN' },
    imap: { host: 'imap.mail.yahoo.com', port: 993, secure: true },
    pop: { host: 'pop.mail.yahoo.com', port: 995, secure: true },
  },

  // Zoho
  'zoho.com': {
    name: 'Zoho Mail',
    type: 'zoho',
    smtp: { host: 'smtppro.zoho.com', port: 465, secure: true, authMethod: 'LOGIN' },
    imap: { host: 'imappro.zoho.com', port: 993, secure: true },
    pop: { host: 'poppro.zoho.com', port: 995, secure: true },
    authGuide: 'If Two-Factor Authentication is enabled, generate an Application-Specific Password in Zoho Accounts.',
  },
  'zohomail.com': {
    name: 'Zoho Mail',
    type: 'zoho',
    smtp: { host: 'smtppro.zoho.com', port: 465, secure: true, authMethod: 'LOGIN' },
    imap: { host: 'imappro.zoho.com', port: 993, secure: true },
    pop: { host: 'poppro.zoho.com', port: 995, secure: true },
  },

  // Apple iCloud
  'icloud.com': {
    name: 'Apple iCloud Mail',
    type: 'apple',
    smtp: { host: 'smtp.mail.me.com', port: 587, secure: false, authMethod: 'LOGIN' },
    imap: { host: 'imap.mail.me.com', port: 993, secure: true },
    pop: null,
    authGuide: 'Apple requires an app-specific password generated at appleid.apple.com.',
  },
  'me.com': {
    name: 'Apple iCloud Mail',
    type: 'apple',
    smtp: { host: 'smtp.mail.me.com', port: 587, secure: false, authMethod: 'LOGIN' },
    imap: { host: 'imap.mail.me.com', port: 993, secure: true },
    pop: null,
    authGuide: 'Apple requires an app-specific password generated at appleid.apple.com.',
  },

  // Fastmail
  'fastmail.com': {
    name: 'Fastmail',
    type: 'fastmail',
    smtp: { host: 'smtp.fastmail.com', port: 465, secure: true, authMethod: 'LOGIN' },
    imap: { host: 'imap.fastmail.com', port: 993, secure: true },
    pop: { host: 'pop.fastmail.com', port: 995, secure: true },
    authGuide: 'Use a Fastmail App Password generated in Settings -> Password & Security.',
  },

  // ProtonMail
  'protonmail.com': {
    name: 'ProtonMail (Bridge Required)',
    type: 'proton',
    smtp: { host: '127.0.0.1', port: 1025, secure: false, authMethod: 'LOGIN' },
    imap: { host: '127.0.0.1', port: 1143, secure: false },
    pop: null,
    authGuide: 'ProtonMail requires Proton Mail Bridge running on your local machine to provide SMTP/IMAP access.',
  },

  // AOL
  'aol.com': {
    name: 'AOL Mail',
    type: 'aol',
    smtp: { host: 'smtp.aol.com', port: 465, secure: true, authMethod: 'LOGIN' },
    imap: { host: 'imap.aol.com', port: 993, secure: true },
    pop: { host: 'pop.aol.com', port: 995, secure: true },
    authGuide: 'Requires an AOL App Password generated in Security settings.',
  },

  // Yandex
  'yandex.com': {
    name: 'Yandex Mail',
    type: 'yandex',
    smtp: { host: 'smtp.yandex.com', port: 465, secure: true, authMethod: 'LOGIN' },
    imap: { host: 'imap.yandex.com', port: 993, secure: true },
    pop: { host: 'pop.yandex.com', port: 995, secure: true },
    authGuide: 'Requires an App Password created in Yandex ID Security settings.',
  }
};

/**
 * Query Mozilla ISPDB autoconfig service for domain email server settings.
 */
async function fetchIspdbAutoconfig(domain) {
  try {
    const url = `https://autoconfig.thunderbird.net/v1.1/${domain}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const xml = await res.text();

    // Parse simple XML tags
    const getTag = (str, tag) => {
      const match = str.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
      return match ? match[1].trim() : null;
    };

    const getAttr = (str, attr) => {
      const match = str.match(new RegExp(`${attr}=["']([^"']+)["']`, 'i'));
      return match ? match[1] : null;
    };

    // Find outgoingServer (SMTP)
    const smtpMatch = xml.match(/<outgoingServer\s+type="smtp"[^>]*>([\s\S]*?)<\/outgoingServer>/i);
    let smtp = null;
    if (smtpMatch) {
      const block = smtpMatch[1];
      const host = getTag(block, 'hostname');
      const port = parseInt(getTag(block, 'port') || '587', 10);
      const socketType = getTag(block, 'socketType') || '';
      smtp = {
        host,
        port,
        secure: socketType.toUpperCase() === 'SSL' || port === 465,
        authMethod: 'LOGIN',
      };
    }

    // Find incomingServer (IMAP)
    const imapMatch = xml.match(/<incomingServer\s+type="imap"[^>]*>([\s\S]*?)<\/incomingServer>/i);
    let imap = null;
    if (imapMatch) {
      const block = imapMatch[1];
      const host = getTag(block, 'hostname');
      const port = parseInt(getTag(block, 'port') || '993', 10);
      const socketType = getTag(block, 'socketType') || '';
      imap = {
        host,
        port,
        secure: socketType.toUpperCase() === 'SSL' || port === 993,
      };
    }

    // Find incomingServer (POP3)
    const popMatch = xml.match(/<incomingServer\s+type="pop3"[^>]*>([\s\S]*?)<\/incomingServer>/i);
    let pop = null;
    if (popMatch) {
      const block = popMatch[1];
      const host = getTag(block, 'hostname');
      const port = parseInt(getTag(block, 'port') || '995', 10);
      const socketType = getTag(block, 'socketType') || '';
      pop = {
        host,
        port,
        secure: socketType.toUpperCase() === 'SSL' || port === 995,
      };
    }

    const providerName = getTag(xml, 'displayName') || domain;

    if (smtp) {
      return {
        name: providerName + ' (ISPDB Verified)',
        type: 'ispdb',
        smtp,
        imap,
        pop,
        authGuide: 'Use your account password. For hosted email, ensure SMTP authentication is enabled.',
      };
    }
  } catch (err) {
    // ISPDB lookup timeout or failure - fallback to MX
  }
  return null;
}

/**
 * Inspect MX DNS records to detect enterprise services (Google Workspace, Microsoft 365, Zoho, etc.)
 */
async function detectByMx(domain) {
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) return null;

    // Sort by priority
    mxRecords.sort((a, b) => a.priority - b.priority);
    const primaryExchange = (mxRecords[0]?.exchange || '').toLowerCase();

    // Check for Google Workspace (formerly G Suite)
    if (
      primaryExchange.includes('google.com') ||
      primaryExchange.includes('googlemail.com') ||
      primaryExchange.includes('aspmx.l.google.com')
    ) {
      return {
        name: `Google Workspace (${domain})`,
        type: 'google',
        smtp: { host: 'smtp.gmail.com', port: 465, secure: true, authMethod: 'LOGIN' },
        imap: { host: 'imap.gmail.com', port: 993, secure: true },
        pop: { host: 'pop.gmail.com', port: 995, secure: true },
        mx: primaryExchange,
        authGuide: 'Google Workspace requires a 16-character App Password if 2-Step Verification is active.',
      };
    }

    // Check for Microsoft 365 / Exchange Online
    if (
      primaryExchange.includes('outlook.com') ||
      primaryExchange.includes('mail.protection.outlook.com') ||
      primaryExchange.includes('office365.com')
    ) {
      return {
        name: `Microsoft 365 / Exchange Online (${domain})`,
        type: 'microsoft',
        smtp: { host: 'smtp.office365.com', port: 587, secure: false, authMethod: 'LOGIN' },
        imap: { host: 'outlook.office365.com', port: 993, secure: true },
        pop: { host: 'outlook.office365.com', port: 995, secure: true },
        mx: primaryExchange,
        authGuide: 'Use your Microsoft 365 email and password. Ensure Authenticated SMTP is enabled in M365 Admin.',
      };
    }

    // Check for Zoho Mail Workplace
    if (primaryExchange.includes('zoho.com') || primaryExchange.includes('zoho.eu')) {
      return {
        name: `Zoho Workplace (${domain})`,
        type: 'zoho',
        smtp: { host: 'smtppro.zoho.com', port: 465, secure: true, authMethod: 'LOGIN' },
        imap: { host: 'imappro.zoho.com', port: 993, secure: true },
        pop: { host: 'poppro.zoho.com', port: 995, secure: true },
        mx: primaryExchange,
        authGuide: 'Use a Zoho Application-Specific Password if 2FA is active.',
      };
    }

    // Check for GoDaddy
    if (primaryExchange.includes('secureserver.net')) {
      return {
        name: `GoDaddy Hosted Mail (${domain})`,
        type: 'godaddy',
        smtp: { host: 'smtpout.secureserver.net', port: 465, secure: true, authMethod: 'LOGIN' },
        imap: { host: 'imap.secureserver.net', port: 993, secure: true },
        pop: { host: 'pop.secureserver.net', port: 995, secure: true },
        mx: primaryExchange,
      };
    }

    // Check for Hostinger
    if (primaryExchange.includes('hostinger.com')) {
      return {
        name: `Hostinger Webmail (${domain})`,
        type: 'hostinger',
        smtp: { host: 'smtp.hostinger.com', port: 465, secure: true, authMethod: 'LOGIN' },
        imap: { host: 'imap.hostinger.com', port: 993, secure: true },
        pop: { host: 'pop.hostinger.com', port: 995, secure: true },
        mx: primaryExchange,
      };
    }

    // Generic domain fallback with primary MX detected
    return {
      name: `Custom Domain (${domain})`,
      type: 'custom',
      smtp: { host: `smtp.${domain}`, port: 465, secure: true, authMethod: 'LOGIN', fallbackPort: 587 },
      imap: { host: `imap.${domain}`, port: 993, secure: true },
      pop: { host: `pop.${domain}`, port: 995, secure: true },
      mx: primaryExchange,
      authGuide: `Detected MX server: ${primaryExchange}. Verify with your hosting or IT administrator if smtp.${domain} requires port 465 or 587.`,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Main Auto-Discovery function.
 * Given an email address or domain, automatically detects:
 * - SMTP outgoing server host, port, security
 * - IMAP incoming server host, port, security
 * - POP3 incoming server host, port, security
 * - Provider guidance and instructions
 */
async function autoDiscoverEmailSettings(emailOrDomain) {
  if (!emailOrDomain || typeof emailOrDomain !== 'string') {
    throw new Error('Please provide a valid email address or domain.');
  }

  const cleaned = emailOrDomain.trim().toLowerCase();
  const domain = cleaned.includes('@') ? cleaned.split('@')[1] : cleaned;

  if (!domain || !domain.includes('.')) {
    throw new Error('Invalid email domain format.');
  }

  // Tier 1: Well-known provider lookup (instant)
  if (KNOWN_PROVIDERS[domain]) {
    return {
      domain,
      detectedBy: 'known_provider_catalog',
      ...KNOWN_PROVIDERS[domain],
    };
  }

  // Tier 2: Mozilla ISPDB Autoconfig
  const ispdbResult = await fetchIspdbAutoconfig(domain);
  if (ispdbResult) {
    return {
      domain,
      detectedBy: 'mozilla_ispdb_autoconfig',
      ...ispdbResult,
    };
  }

  // Tier 3: DNS MX Resolution (checks Google Workspace, Office 365, Zoho, etc.)
  const mxResult = await detectByMx(domain);
  if (mxResult) {
    return {
      domain,
      detectedBy: 'dns_mx_inspection',
      ...mxResult,
    };
  }

  // Tier 4: Standard RFC Host Heuristic Fallback
  return {
    domain,
    name: `Custom Mail Server (${domain})`,
    type: 'generic_fallback',
    detectedBy: 'standard_heuristics',
    smtp: { host: `smtp.${domain}`, port: 465, secure: true, authMethod: 'LOGIN', fallbackPort: 587 },
    imap: { host: `imap.${domain}`, port: 993, secure: true },
    pop: { host: `pop.${domain}`, port: 995, secure: true },
    authGuide: `Default servers configured for ${domain}. You can manually edit the SMTP host and port if your provider uses a different hostname.`,
  };
}

module.exports = {
  autoDiscoverEmailSettings,
  KNOWN_PROVIDERS,
};
