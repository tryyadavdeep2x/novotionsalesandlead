/**
 * MailFlow PRO — Client Application Logic
 */

// Global State
const state = {
  currentStep: 1,
  smtp: {
    host: '',
    port: 465,
    secure: true,
    user: '',
    pass: '',
    senderName: '',
    replyTo: '',
    providerName: '',
  },
  isSmtpVerified: false,
  smtpProfiles: [],
  activeProfileId: localStorage.getItem('novotion_active_smtp_id') || null,
  contacts: [],
  columns: [],
  previewIndex: 0,
  campaign: {
    id: null,
    status: 'idle',
    total: 0,
    sent: 0,
    failed: 0,
    recipients: [],
  },
  sseSource: null,
  ai: {
    provider: localStorage.getItem('novotion_ai_provider') || 'gemini',
    model: localStorage.getItem('novotion_ai_model') || 'gemini-2.5-flash',
    customModel: localStorage.getItem('novotion_ai_custom_model') || '',
    baseUrl: localStorage.getItem('novotion_ai_base_url') || '',
    apiKey: localStorage.getItem('novotion_ai_key') || '',
    isConfigured: !!localStorage.getItem('novotion_ai_key') || localStorage.getItem('novotion_ai_provider') === 'custom',
    activeAgent: 'outreach',
    lastResult: null,
  },
};

// Universal AI Models Catalog
const AI_MODELS = {
  gemini: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recommended — Superfast & Smart)' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Deep Strategy & Complex Copy)' },
    { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash (Next-Gen Performance)' },
    { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite (Low Latency)' },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o (Omni Flagship Intelligence)' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Ultra Fast & Cost-Efficient)' },
    { id: 'o3-mini', name: 'o3-mini (High-Precision Reasoning)' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo (Comprehensive Context)' },
  ],
  claude: [
    { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet (Hybrid Reasoning & Copy)' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Elite B2B Sales Persuasion)' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Lightning Response)' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Groq Llama 3.3 70B (500+ tok/s Ultra Inference)' },
    { id: 'deepseek-r1-distill-llama-70b', name: 'Groq DeepSeek R1 70B (Deep Reasoning)' },
    { id: 'mixtral-8x7b-32768', name: 'Groq Mixtral 8x7B (Long-Form Sequences)' },
  ],
  custom: [
    { id: 'custom-endpoint', name: 'Custom OpenAI-Compatible / Ollama / OpenRouter' },
  ],
};

// Preset Templates
const PRESET_TEMPLATES = {
  cold_intro: {
    subject: "Quick question for {{first_name}} regarding {{company}}'s strategic growth",
    body: `Hi {{first_name}},\n\nI hope you're having a productive week!\n\nI was reviewing {{company}}'s recent work and noticed your focus on clinical and operational efficiency. We recently helped similar organizations automate their outreach and communication workflows with high deliverability.\n\nWould you have 10 minutes next Tuesday for a brief intro call?\n\nBest regards,\n{{sender_name}}\nNovotion Services`,
  },
  healthcare_outreach: {
    subject: "Partnership opportunity for {{first_name}} at {{company}}",
    body: `Dear {{first_name}},\n\nI am reaching out regarding {{company}}'s medical and specialized healthcare initiatives. As {{position}}, I imagine streamlining patient care pipelines and executive workflows is top of mind.\n\nWe would love to share a 3-minute executive summary on how peer clinics across the UK and USA have scaled their operations.\n\nCould I send over a quick overview for your review?\n\nWarm regards,\n{{sender_name}}`,
  },
  quick_followup: {
    subject: "Following up: {{first_name}}, did you get a chance to review this?",
    body: `Hi {{first_name}},\n\nJust following up on my previous note to see if this was of interest for {{company}}.\n\nLet me know if you would like me to circle back next month instead!\n\nBest,\n{{sender_name}}`,
  },
  custom: {
    subject: "Hello {{first_name}}",
    body: `Hi {{first_name}},\n\nWrite your message here... You can use merge tags like {{company}} or {{position}}!`,
  },
};

// DOM Elements
const DOM = {
  // Navigation
  stepBtns: [1, 2, 3, 4].map((n) => document.getElementById(`stepBtn${n}`)),
  stepSections: [1, 2, 3, 4].map((n) => document.getElementById(`stepSection${n}`)),
  headerSmtpPill: document.getElementById('headerSmtpPill'),

  // Step 1
  emailInput: document.getElementById('emailInput'),
  autoDetectBtn: document.getElementById('autoDetectBtn'),
  detectedSummaryBox: document.getElementById('detectedSummaryBox'),
  providerBadge: document.getElementById('providerBadge'),
  detectMethodText: document.getElementById('detectMethodText'),
  detectedSmtpHost: document.getElementById('detectedSmtpHost'),
  detectedSmtpPort: document.getElementById('detectedSmtpPort'),
  smtpSecureBadge: document.getElementById('smtpSecureBadge'),
  detectedImapHost: document.getElementById('detectedImapHost'),
  detectedImapPort: document.getElementById('detectedImapPort'),
  imapSecureBadge: document.getElementById('imapSecureBadge'),
  detectedPopHost: document.getElementById('detectedPopHost'),
  detectedPopPort: document.getElementById('detectedPopPort'),
  popSecureBadge: document.getElementById('popSecureBadge'),
  authGuideBox: document.getElementById('authGuideBox'),
  authGuideText: document.getElementById('authGuideText'),
  smtpUser: document.getElementById('smtpUser'),
  smtpPass: document.getElementById('smtpPass'),
  togglePwBtn: document.getElementById('togglePwBtn'),
  senderName: document.getElementById('senderName'),
  replyToEmail: document.getElementById('replyToEmail'),
  manualSmtpHost: document.getElementById('manualSmtpHost'),
  manualSmtpPort: document.getElementById('manualSmtpPort'),
  manualSmtpSecure: document.getElementById('manualSmtpSecure'),
  testSmtpBtn: document.getElementById('testSmtpBtn'),
  smtpAlertBox: document.getElementById('smtpAlertBox'),
  proceedToStep2Btn: document.getElementById('proceedToStep2Btn'),

  // Step 2
  uploadDropzone: document.getElementById('uploadDropzone'),
  excelFileInput: document.getElementById('excelFileInput'),
  downloadSampleBtn: document.getElementById('downloadSampleBtn'),
  addManualContactBtn: document.getElementById('addManualContactBtn'),
  clearContactsBtn: document.getElementById('clearContactsBtn'),
  totalContactsCount: document.getElementById('totalContactsCount'),
  validEmailsCount: document.getElementById('validEmailsCount'),
  columnsCount: document.getElementById('columnsCount'),
  contactSearchInput: document.getElementById('contactSearchInput'),
  contactsTableBody: document.getElementById('contactsTableBody'),
  proceedToStep3Btn: document.getElementById('proceedToStep3Btn'),

  // Step 3
  templatePresetSelect: document.getElementById('templatePresetSelect'),
  mergeTagsPills: document.getElementById('mergeTagsPills'),
  emailSubject: document.getElementById('emailSubject'),
  emailBody: document.getElementById('emailBody'),
  testEmailRecipient: document.getElementById('testEmailRecipient'),
  sendTestEmailBtn: document.getElementById('sendTestEmailBtn'),
  testEmailStatus: document.getElementById('testEmailStatus'),
  prevRecipientBtn: document.getElementById('prevRecipientBtn'),
  nextRecipientBtn: document.getElementById('nextRecipientBtn'),
  previewRecipientIndex: document.getElementById('previewRecipientIndex'),
  previewAvatar: document.getElementById('previewAvatar'),
  previewName: document.getElementById('previewName'),
  previewEmail: document.getElementById('previewEmail'),
  previewCompany: document.getElementById('previewCompany'),
  renderedSubjectText: document.getElementById('renderedSubjectText'),
  renderedBodyText: document.getElementById('renderedBodyText'),
  proceedToStep4Btn: document.getElementById('proceedToStep4Btn'),

  // Step 4
  summaryTotalRecipients: document.getElementById('summaryTotalRecipients'),
  summaryFromEmail: document.getElementById('summaryFromEmail'),
  summarySmtpHost: document.getElementById('summarySmtpHost'),
  campaignDelaySelect: document.getElementById('campaignDelaySelect'),
  startCampaignBtn: document.getElementById('startCampaignBtn'),
  pauseCampaignBtn: document.getElementById('pauseCampaignBtn'),
  resumeCampaignBtn: document.getElementById('resumeCampaignBtn'),
  stopCampaignBtn: document.getElementById('stopCampaignBtn'),
  exportResultsBtn: document.getElementById('exportResultsBtn'),
  progressPercentText: document.getElementById('progressPercentText'),
  statSentCount: document.getElementById('statSentCount'),
  statFailedCount: document.getElementById('statFailedCount'),
  statTotalCount: document.getElementById('statTotalCount'),
  progressBarFill: document.getElementById('progressBarFill'),
  deliveryTableBody: document.getElementById('deliveryTableBody'),

  // Modal Contact
  addContactModal: document.getElementById('addContactModal'),
  closeContactModalBtn: document.getElementById('closeContactModalBtn'),
  cancelContactModalBtn: document.getElementById('cancelContactModalBtn'),
  saveContactModalBtn: document.getElementById('saveContactModalBtn'),
  newFirstName: document.getElementById('newFirstName'),
  newLastName: document.getElementById('newLastName'),
  newEmail: document.getElementById('newEmail'),
  newCompany: document.getElementById('newCompany'),
  newPosition: document.getElementById('newPosition'),

  // Theme Toggle
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  themeToggleIcon: document.getElementById('themeToggleIcon'),
  themeToggleText: document.getElementById('themeToggleText'),

  // AI Header & Drawer
  headerAiPill: document.getElementById('headerAiPill'),
  aiStatusDot: document.getElementById('aiStatusDot'),
  aiStatusLabel: document.getElementById('aiStatusLabel'),
  launchAiDrawerBtn: document.getElementById('launchAiDrawerBtn'),
  openAiDrawerFromStep3Btn: document.getElementById('openAiDrawerFromStep3Btn'),
  aiDrawerOverlay: document.getElementById('aiDrawerOverlay'),
  aiAgentDrawer: document.getElementById('aiAgentDrawer'),
  closeAiDrawerBtn: document.getElementById('closeAiDrawerBtn'),
  drawerAiBadge: document.getElementById('drawerAiBadge'),
  switchModelFromDrawerBtn: document.getElementById('switchModelFromDrawerBtn'),
  agentPillBtns: document.querySelectorAll('.agent-pill-btn'),
  audienceGroup: document.getElementById('audienceGroup'),
  toneGroup: document.getElementById('toneGroup'),
  aiToneSelect: document.getElementById('aiToneSelect'),
  aiAudienceContext: document.getElementById('aiAudienceContext'),
  aiPromptLabel: document.getElementById('aiPromptLabel'),
  aiPromptInput: document.getElementById('aiPromptInput'),
  executeAiAgentBtn: document.getElementById('executeAiAgentBtn'),
  agentOutputBox: document.getElementById('agentOutputBox'),
  outputModelBadge: document.getElementById('outputModelBadge'),
  agentOutputContent: document.getElementById('agentOutputContent'),
  applyAiToTemplateBtn: document.getElementById('applyAiToTemplateBtn'),
  copyAiOutputBtn: document.getElementById('copyAiOutputBtn'),

  // AI Modal
  aiAccountModal: document.getElementById('aiAccountModal'),
  closeAiAccountModalBtn: document.getElementById('closeAiAccountModalBtn'),
  cancelAiAccountModalBtn: document.getElementById('cancelAiAccountModalBtn'),
  aiProviderSelect: document.getElementById('aiProviderSelect'),
  aiModelSelect: document.getElementById('aiModelSelect'),
  customBaseUrlGroup: document.getElementById('customBaseUrlGroup'),
  aiBaseUrlInput: document.getElementById('aiBaseUrlInput'),
  customModelGroup: document.getElementById('customModelGroup'),
  aiCustomModelInput: document.getElementById('aiCustomModelInput'),
  aiApiKeyInput: document.getElementById('aiApiKeyInput'),
  aiApiKeyRequiredStar: document.getElementById('aiApiKeyRequiredStar'),
  toggleAiKeyBtn: document.getElementById('toggleAiKeyBtn'),
  aiKeyHintBox: document.getElementById('aiKeyHintBox'),
  aiAuthAlertBox: document.getElementById('aiAuthAlertBox'),
  disconnectAiKeyBtn: document.getElementById('disconnectAiKeyBtn'),
  saveAiAccountBtn: document.getElementById('saveAiAccountBtn'),

  // Saved Profiles & Sessions
  savedProfilesPanel: document.getElementById('savedProfilesPanel'),
  savedSmtpProfileSelect: document.getElementById('savedSmtpProfileSelect'),
  loadSmtpProfileBtn: document.getElementById('loadSmtpProfileBtn'),
  deleteSmtpProfileBtn: document.getElementById('deleteSmtpProfileBtn'),
  saveCurrentSmtpBtn: document.getElementById('saveCurrentSmtpBtn'),
  quickProfilesChips: document.getElementById('quickProfilesChips'),

  // Save Profile Modal
  saveSmtpModal: document.getElementById('saveSmtpModal'),
  closeSaveSmtpModalBtn: document.getElementById('closeSaveSmtpModalBtn'),
  cancelSaveSmtpModalBtn: document.getElementById('cancelSaveSmtpModalBtn'),
  saveProfileNameInput: document.getElementById('saveProfileNameInput'),
  saveProfileHostSummary: document.getElementById('saveProfileHostSummary'),
  saveProfileUserSummary: document.getElementById('saveProfileUserSummary'),
  saveProfileSenderSummary: document.getElementById('saveProfileSenderSummary'),
  saveProfileRememberPassword: document.getElementById('saveProfileRememberPassword'),
  saveProfileAlertBox: document.getElementById('saveProfileAlertBox'),
  confirmSaveSmtpBtn: document.getElementById('confirmSaveSmtpBtn'),
};

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupNavigation();
  setupSavedProfiles();
  setupAutoDiscovery();
  setupSmtpVerification();
  setupFileUpload();
  setupContactModal();
  setupTemplateComposer();
  setupCampaignControls();
  setupAiAgentSystem();

  // Load default template preset
  loadTemplatePreset('cold_intro');

  // Populate sample contacts if table is empty for instant preview delight
  if (state.contacts.length === 0) {
    loadDefaultDemoContacts();
  }
});

// ============================================================================
// THEME MANAGEMENT (LIGHT & OBSIDIAN DARK MODE)
// ============================================================================
function initTheme() {
  const savedTheme = localStorage.getItem('novotion_theme') || 'light';
  applyTheme(savedTheme);

  if (DOM.themeToggleBtn) {
    DOM.themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = current === 'light' ? 'dark' : 'light';
      applyTheme(newTheme);
    });
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('novotion_theme', theme);

  if (DOM.themeToggleIcon && DOM.themeToggleText) {
    if (theme === 'dark') {
      DOM.themeToggleIcon.textContent = '🌙';
      DOM.themeToggleText.textContent = 'Dark';
      DOM.themeToggleBtn.title = 'Switch to Light Mode';
    } else {
      DOM.themeToggleIcon.textContent = '☀️';
      DOM.themeToggleText.textContent = 'Light';
      DOM.themeToggleBtn.title = 'Switch to Dark Mode';
    }
  }
}

// ============================================================================
// WIZARD NAVIGATION
// ============================================================================
function setupNavigation() {
  DOM.stepBtns.forEach((btn, idx) => {
    btn.addEventListener('click', () => goToStep(idx + 1));
  });

  DOM.proceedToStep2Btn.addEventListener('click', () => goToStep(2));
  DOM.proceedToStep3Btn.addEventListener('click', () => goToStep(3));
  DOM.proceedToStep4Btn.addEventListener('click', () => {
    updateCampaignSummary();
    goToStep(4);
  });
}

function goToStep(stepNumber) {
  state.currentStep = stepNumber;

  DOM.stepBtns.forEach((btn, idx) => {
    btn.classList.toggle('active', idx + 1 === stepNumber);
  });

  DOM.stepSections.forEach((section, idx) => {
    section.classList.toggle('active', idx + 1 === stepNumber);
    section.classList.toggle('hidden', idx + 1 !== stepNumber);
  });

  if (stepNumber === 3) {
    updateLivePreview();
  } else if (stepNumber === 4) {
    updateCampaignSummary();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================================
// 1. SAVED SMTP SERVER PROFILES & SESSIONS
// ============================================================================
const DEFAULT_SMTP_PROFILES = [
  {
    id: 'profile_gmail_preset',
    name: 'Google Workspace (smtp.gmail.com)',
    email: 'user@gmail.com',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    user: 'user@gmail.com',
    pass: '',
    senderName: 'Sales Director',
    replyTo: '',
    isPreset: true,
  },
  {
    id: 'profile_m365_preset',
    name: 'Microsoft 365 (smtp.office365.com)',
    email: 'outreach@domain.com',
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    user: 'outreach@domain.com',
    pass: '',
    senderName: 'Growth Lead',
    replyTo: '',
    isPreset: true,
  },
];

function setupSavedProfiles() {
  loadStoredProfiles();

  // Dropdown change
  DOM.savedSmtpProfileSelect.addEventListener('change', (e) => {
    const pId = e.target.value;
    updateDeleteBtnState(pId);
  });

  // Load Profile button
  DOM.loadSmtpProfileBtn.addEventListener('click', () => {
    const pId = DOM.savedSmtpProfileSelect.value;
    if (!pId) {
      alert('Please select a saved profile from the dropdown first.');
      return;
    }
    loadProfileById(pId);
  });

  // Delete Profile button
  DOM.deleteSmtpProfileBtn.addEventListener('click', deleteSelectedProfile);

  // Save Current Account button
  DOM.saveCurrentSmtpBtn.addEventListener('click', openSaveProfileModal);

  // Modal Cancel & Close
  DOM.closeSaveSmtpModalBtn.addEventListener('click', closeSaveProfileModal);
  DOM.cancelSaveSmtpModalBtn.addEventListener('click', closeSaveProfileModal);

  // Modal Confirm Save
  DOM.confirmSaveSmtpBtn.addEventListener('click', saveCurrentAsProfile);

  // Restore active session if available
  if (state.activeProfileId) {
    loadProfileById(state.activeProfileId, true);
  }
}

function loadStoredProfiles() {
  try {
    const stored = localStorage.getItem('novotion_smtp_profiles');
    if (stored) {
      state.smtpProfiles = JSON.parse(stored);
    } else {
      state.smtpProfiles = [...DEFAULT_SMTP_PROFILES];
      localStorage.setItem('novotion_smtp_profiles', JSON.stringify(state.smtpProfiles));
    }
  } catch (err) {
    state.smtpProfiles = [...DEFAULT_SMTP_PROFILES];
  }
  renderProfilesDropdown();
  renderQuickProfileChips();
}

function renderProfilesDropdown() {
  const select = DOM.savedSmtpProfileSelect;
  const currentVal = select.value || state.activeProfileId;
  select.innerHTML = '<option value="">-- Select a Saved SMTP Session --</option>';

  state.smtpProfiles.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.name} (${p.host}:${p.port})`;
    if (p.id === currentVal) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });

  updateDeleteBtnState(select.value);
}

function updateDeleteBtnState(profileId) {
  const found = state.smtpProfiles.find((p) => p.id === profileId);
  if (found && !found.isPreset) {
    DOM.deleteSmtpProfileBtn.classList.remove('hidden');
  } else {
    DOM.deleteSmtpProfileBtn.classList.add('hidden');
  }
}

function renderQuickProfileChips() {
  const container = DOM.quickProfilesChips;
  container.innerHTML = '<span class="quick-chips-label">Quick Switch:</span>';

  state.smtpProfiles.forEach((p) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `quick-profile-chip ${p.id === state.activeProfileId ? 'active' : ''}`;
    btn.innerHTML = `🏢 ${escapeHtml(p.name)}`;
    btn.title = `Switch to ${p.name} (${p.host})`;
    btn.addEventListener('click', () => {
      loadProfileById(p.id);
    });
    container.appendChild(btn);
  });
}

function loadProfileById(profileId, isInitialLoad = false) {
  const profile = state.smtpProfiles.find((p) => p.id === profileId);
  if (!profile) return;

  state.activeProfileId = profile.id;
  localStorage.setItem('novotion_active_smtp_id', profile.id);

  // Populate form fields
  DOM.emailInput.value = profile.email || profile.user || '';
  DOM.smtpUser.value = profile.user || '';
  DOM.smtpPass.value = profile.pass || '';
  DOM.senderName.value = profile.senderName || '';
  DOM.replyToEmail.value = profile.replyTo || '';
  DOM.manualSmtpHost.value = profile.host || '';
  DOM.manualSmtpPort.value = profile.port || 465;
  DOM.manualSmtpSecure.value = profile.secure ? 'true' : 'false';

  // Update internal state
  state.smtp = {
    host: profile.host,
    port: profile.port,
    secure: profile.secure,
    user: profile.user,
    pass: profile.pass,
    senderName: profile.senderName,
    replyTo: profile.replyTo,
    profileId: profile.id,
    profileName: profile.name,
  };

  // Sync state & UI
  state.isSmtpVerified = !!profile.pass;

  DOM.savedSmtpProfileSelect.value = profile.id;
  updateDeleteBtnState(profile.id);
  renderQuickProfileChips();

  // Update header pill
  DOM.headerSmtpPill.innerHTML = `
    <span class="status-dot ${profile.pass ? 'connected' : 'disconnected'}"></span>
    <span class="status-label">💾 ${escapeHtml(profile.name)}</span>
  `;

  if (!isInitialLoad) {
    showSmtpAlert(`✅ Loaded session: "${profile.name}" (${profile.host}:${profile.port})`, 'success');
  }
}

function openSaveProfileModal() {
  const host = DOM.manualSmtpHost.value.trim() || state.smtp.host;
  const port = DOM.manualSmtpPort.value.trim() || state.smtp.port;
  const user = DOM.smtpUser.value.trim();
  const sender = DOM.senderName.value.trim();

  if (!host || !user) {
    alert('Please enter at least your SMTP Host and Login Username before saving a profile.');
    return;
  }

  DOM.saveProfileHostSummary.textContent = `${host}:${port || 465}`;
  DOM.saveProfileUserSummary.textContent = user;
  DOM.saveProfileSenderSummary.textContent = sender || '(Not specified)';

  // Suggest a nickname
  DOM.saveProfileNameInput.value = sender ? `${sender} (${user.split('@')[1] || host})` : `${user} Session`;
  DOM.saveProfileAlertBox.classList.add('hidden');
  DOM.saveSmtpModal.classList.remove('hidden');
  DOM.saveProfileNameInput.focus();
}

function closeSaveProfileModal() {
  DOM.saveSmtpModal.classList.add('hidden');
}

function saveCurrentAsProfile() {
  const name = DOM.saveProfileNameInput.value.trim();
  if (!name) {
    DOM.saveProfileAlertBox.textContent = 'Please provide a profile nickname.';
    DOM.saveProfileAlertBox.className = 'alert-box error';
    DOM.saveProfileAlertBox.classList.remove('hidden');
    return;
  }

  const host = DOM.manualSmtpHost.value.trim() || state.smtp.host;
  const port = parseInt(DOM.manualSmtpPort.value.trim() || state.smtp.port || 465, 10);
  const secure = DOM.manualSmtpSecure.value === 'true';
  const user = DOM.smtpUser.value.trim();
  const pass = DOM.saveProfileRememberPassword.checked ? DOM.smtpPass.value.trim() : '';
  const senderName = DOM.senderName.value.trim();
  const replyTo = DOM.replyToEmail.value.trim();
  const email = DOM.emailInput.value.trim() || user;

  const newProfile = {
    id: 'profile_' + Date.now(),
    name,
    email,
    host,
    port,
    secure,
    user,
    pass,
    senderName,
    replyTo,
    isPreset: false,
    savedAt: new Date().toISOString(),
  };

  state.smtpProfiles.push(newProfile);
  localStorage.setItem('novotion_smtp_profiles', JSON.stringify(state.smtpProfiles));

  state.activeProfileId = newProfile.id;
  localStorage.setItem('novotion_active_smtp_id', newProfile.id);

  renderProfilesDropdown();
  renderQuickProfileChips();
  closeSaveProfileModal();

  DOM.headerSmtpPill.innerHTML = `
    <span class="status-dot ${pass ? 'connected' : 'disconnected'}"></span>
    <span class="status-label">💾 ${escapeHtml(newProfile.name)}</span>
  `;

  showSmtpAlert(`✅ SMTP profile "${name}" successfully saved and active!`, 'success');
}

function deleteSelectedProfile() {
  const pId = DOM.savedSmtpProfileSelect.value;
  const profile = state.smtpProfiles.find((p) => p.id === pId);
  if (!profile) return;

  if (profile.isPreset) {
    alert('Default templates cannot be deleted.');
    return;
  }

  if (confirm(`Are you sure you want to delete profile "${profile.name}"?`)) {
    state.smtpProfiles = state.smtpProfiles.filter((p) => p.id !== pId);
    localStorage.setItem('novotion_smtp_profiles', JSON.stringify(state.smtpProfiles));

    if (state.activeProfileId === pId) {
      state.activeProfileId = null;
      localStorage.removeItem('novotion_active_smtp_id');
      DOM.headerSmtpPill.innerHTML = `
        <span class="status-dot disconnected"></span>
        <span class="status-label">SMTP: Not Connected</span>
      `;
    }

    renderProfilesDropdown();
    renderQuickProfileChips();
    showSmtpAlert(`🗑️ Deleted profile "${profile.name}".`, 'info');
  }
}

// ============================================================================
// 2. AUTO-DISCOVERY & SMTP SETUP
// ============================================================================
function setupAutoDiscovery() {
  let debounceTimer = null;

  DOM.emailInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const val = e.target.value.trim();
    if (val.includes('@') && val.split('@')[1].includes('.')) {
      debounceTimer = setTimeout(() => triggerAutoDiscover(val), 600);
    }
  });

  DOM.autoDetectBtn.addEventListener('click', () => {
    const val = DOM.emailInput.value.trim();
    if (!val) {
      alert('Please enter an email address.');
      return;
    }
    triggerAutoDiscover(val);
  });

  DOM.togglePwBtn.addEventListener('click', () => {
    const type = DOM.smtpPass.getAttribute('type') === 'password' ? 'text' : 'password';
    DOM.smtpPass.setAttribute('type', type);
    DOM.togglePwBtn.textContent = type === 'password' ? '👁️' : '🔒';
  });
}

async function triggerAutoDiscover(email) {
  const btnSpinner = DOM.autoDetectBtn.querySelector('.btn-spinner');
  const btnText = DOM.autoDetectBtn.querySelector('.btn-text');

  btnSpinner.classList.remove('hidden');
  btnText.textContent = 'Discovering...';
  DOM.autoDetectBtn.disabled = true;

  try {
    const res = await fetch(`/api/autodiscover?email=${encodeURIComponent(email)}`);
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || 'Server detection failed');
    }

    renderDiscoveryResult(data);
  } catch (err) {
    alert('Notice: Could not automatically detect servers. You can manually enter your SMTP server below.\n' + err.message);
  } finally {
    btnSpinner.classList.add('hidden');
    btnText.textContent = '🔍 Auto-Detect Servers';
    DOM.autoDetectBtn.disabled = false;
  }
}

function renderDiscoveryResult(data) {
  DOM.detectedSummaryBox.classList.remove('hidden');

  DOM.providerBadge.textContent = data.name || data.domain;
  DOM.detectMethodText.textContent = `Discovered via ${data.detectedBy.replace(/_/g, ' ')}`;

  // Outgoing SMTP
  if (data.smtp) {
    DOM.detectedSmtpHost.textContent = data.smtp.host;
    DOM.detectedSmtpPort.textContent = data.smtp.port;
    DOM.smtpSecureBadge.textContent = data.smtp.secure ? 'SSL / 465' : 'STARTTLS / 587';

    DOM.manualSmtpHost.value = data.smtp.host;
    DOM.manualSmtpPort.value = data.smtp.port;
    DOM.manualSmtpSecure.value = data.smtp.secure ? 'true' : 'false';

    state.smtp.host = data.smtp.host;
    state.smtp.port = data.smtp.port;
    state.smtp.secure = data.smtp.secure;
  }

  // Incoming IMAP
  if (data.imap) {
    DOM.detectedImapHost.textContent = data.imap.host;
    DOM.detectedImapPort.textContent = data.imap.port;
    DOM.imapSecureBadge.textContent = data.imap.secure ? 'SSL / 993' : 'STARTTLS';
  } else {
    DOM.detectedImapHost.textContent = 'Not Supported';
    DOM.detectedImapPort.textContent = '-';
  }

  // Incoming POP3
  if (data.pop) {
    DOM.detectedPopHost.textContent = data.pop.host;
    DOM.detectedPopPort.textContent = data.pop.port;
    DOM.popSecureBadge.textContent = data.pop.secure ? 'SSL / 995' : 'STARTTLS';
  } else {
    DOM.detectedPopHost.textContent = 'Not Supported';
    DOM.detectedPopPort.textContent = '-';
  }

  // Auth Guidance Box
  if (data.authGuide) {
    DOM.authGuideBox.classList.remove('hidden');
    DOM.authGuideText.textContent = data.authGuide;
  } else {
    DOM.authGuideBox.classList.add('hidden');
  }

  // Pre-fill username if empty
  if (!DOM.smtpUser.value.trim() && DOM.emailInput.value.trim()) {
    DOM.smtpUser.value = DOM.emailInput.value.trim();
  }
}

function setupSmtpVerification() {
  DOM.testSmtpBtn.addEventListener('click', async () => {
    const host = DOM.manualSmtpHost.value.trim() || state.smtp.host;
    const port = parseInt(DOM.manualSmtpPort.value.trim() || state.smtp.port, 10);
    const secure = DOM.manualSmtpSecure.value === 'true';
    const user = DOM.smtpUser.value.trim();
    const pass = DOM.smtpPass.value.trim();
    const senderName = DOM.senderName.value.trim();
    const replyTo = DOM.replyToEmail.value.trim();

    if (!host || !port || !user || !pass) {
      showSmtpAlert('Please enter your SMTP Host, Port, Username, and Password.', 'error');
      return;
    }

    const btnSpinner = DOM.testSmtpBtn.querySelector('.btn-spinner');
    const btnText = DOM.testSmtpBtn.querySelector('.btn-text');

    btnSpinner.classList.remove('hidden');
    btnText.textContent = 'Connecting to SMTP...';
    DOM.testSmtpBtn.disabled = true;

    try {
      const res = await fetch('/api/verify-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port, secure, user, pass }),
      });
      const data = await res.json();

      if (data.success) {
        state.isSmtpVerified = true;
        state.smtp = { host, port, secure, user, pass, senderName, replyTo };

        showSmtpAlert(`✅ ${data.message}`, 'success');

        // Update top pill
        DOM.headerSmtpPill.innerHTML = `
          <span class="status-dot connected"></span>
          <span class="status-label">Connected: ${user}</span>
        `;
      } else {
        state.isSmtpVerified = false;
        showSmtpAlert(`❌ ${data.message}`, 'error');
      }
    } catch (err) {
      showSmtpAlert(`❌ Connection Error: ${err.message}`, 'error');
    } finally {
      btnSpinner.classList.add('hidden');
      btnText.textContent = 'Test Connection & Login';
      DOM.testSmtpBtn.disabled = false;
    }
  });
}

function showSmtpAlert(msg, type) {
  DOM.smtpAlertBox.textContent = msg;
  DOM.smtpAlertBox.className = `alert-box ${type}`;
  DOM.smtpAlertBox.classList.remove('hidden');
}

// ============================================================================
// 2. CONTACTS & EXCEL UPLOAD
// ============================================================================
function setupFileUpload() {
  const dropzone = DOM.uploadDropzone;
  const fileInput = DOM.excelFileInput;

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processExcelFile(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      processExcelFile(e.target.files[0]);
    }
  });

  DOM.downloadSampleBtn.addEventListener('click', () => {
    window.location.href = '/api/sample-template';
  });

  DOM.clearContactsBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all contacts?')) {
      state.contacts = [];
      state.columns = [];
      renderContactsTable();
      updateLivePreview();
    }
  });

  DOM.contactSearchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    filterContactsTable(term);
  });
}

async function processExcelFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/upload-recipients', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to upload file');
    }

    state.contacts = data.contacts;
    state.columns = data.columns;
    state.previewIndex = 0;

    renderContactsTable();
    updateMergeTagsBar();
    updateLivePreview();
    alert(`Successfully loaded ${data.validContacts} contacts from ${data.filename}!`);
  } catch (err) {
    alert('Error processing file: ' + err.message);
  }
}

function renderContactsTable() {
  const tbody = DOM.contactsTableBody;
  const contacts = state.contacts;

  DOM.totalContactsCount.textContent = contacts.length;
  DOM.validEmailsCount.textContent = contacts.length;
  DOM.columnsCount.textContent = state.columns.length || 5;

  if (contacts.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="7">
          <div class="empty-state">
            <span class="empty-icon">📭</span>
            <p>No contacts loaded yet.</p>
            <span class="empty-sub">Upload an Excel file or click "Add Single Contact" to begin.</span>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = contacts
    .map(
      (c, idx) => `
      <tr data-id="${c.id}">
        <td class="code">${idx + 1}</td>
        <td><strong>${escapeHtml(c.first_name || '-')}</strong></td>
        <td>${escapeHtml(c.last_name || '-')}</td>
        <td class="code">${escapeHtml(c.email)}</td>
        <td>${escapeHtml(c.company || '-')}</td>
        <td><span class="badge">${escapeHtml(c.position || '-')}</span></td>
        <td>
          <button class="btn-icon-nav text-danger" onclick="deleteContact(${c.id})" title="Remove">✕</button>
        </td>
      </tr>
    `
    )
    .join('');
}

function filterContactsTable(term) {
  const rows = DOM.contactsTableBody.querySelectorAll('tr');
  rows.forEach((row) => {
    if (row.classList.contains('empty-row')) return;
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(term) ? '' : 'none';
  });
}

function deleteContact(id) {
  state.contacts = state.contacts.filter((c) => c.id !== id);
  renderContactsTable();
  updateLivePreview();
}

// Manual Add Contact Modal
function setupContactModal() {
  DOM.addManualContactBtn.addEventListener('click', () => {
    DOM.addContactModal.classList.remove('hidden');
    DOM.newFirstName.focus();
  });

  const closeModal = () => DOM.addContactModal.classList.add('hidden');
  DOM.closeContactModalBtn.addEventListener('click', closeModal);
  DOM.cancelContactModalBtn.addEventListener('click', closeModal);

  DOM.saveContactModalBtn.addEventListener('click', () => {
    const firstName = DOM.newFirstName.value.trim();
    const lastName = DOM.newLastName.value.trim();
    const email = DOM.newEmail.value.trim();
    const company = DOM.newCompany.value.trim();
    const position = DOM.newPosition.value.trim();

    if (!firstName || !email || !email.includes('@')) {
      alert('Please provide at least a First Name and a valid Email address.');
      return;
    }

    const newContact = {
      id: Date.now(),
      first_name: firstName,
      last_name: lastName,
      name: `${firstName} ${lastName}`.trim(),
      email,
      company,
      position,
    };

    state.contacts.push(newContact);
    renderContactsTable();
    updateLivePreview();
    closeModal();

    // Reset inputs
    DOM.newFirstName.value = '';
    DOM.newLastName.value = '';
    DOM.newEmail.value = '';
    DOM.newCompany.value = '';
    DOM.newPosition.value = '';
  });
}

function loadDefaultDemoContacts() {
  state.contacts = [
    {
      id: 1,
      first_name: 'Sarah',
      last_name: 'Jenkins',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@example.com',
      company: 'St. Jude Medical Group',
      position: 'Clinical Director',
    },
    {
      id: 2,
      first_name: 'David',
      last_name: 'Miller',
      name: 'David Miller',
      email: 'david.miller@example.com',
      company: 'Apex Healthcare UK',
      position: 'Chief Executive Officer',
    },
    {
      id: 3,
      first_name: 'Elena',
      last_name: 'Rostova',
      name: 'Elena Rostova',
      email: 'elena.rostova@example.com',
      company: 'BioTech Diagnostics USA',
      position: 'VP of Procurement',
    },
  ];
  state.columns = ['First Name', 'Last Name', 'Email', 'Company', 'Position'];
  renderContactsTable();
  updateLivePreview();
}

// ============================================================================
// 3. TEMPLATE COMPOSER & LIVE DYNAMIC PREVIEW
// ============================================================================
function setupTemplateComposer() {
  DOM.templatePresetSelect.addEventListener('change', (e) => {
    loadTemplatePreset(e.target.value);
  });

  DOM.emailSubject.addEventListener('input', updateLivePreview);
  DOM.emailBody.addEventListener('input', updateLivePreview);

  // Recipient switcher
  DOM.prevRecipientBtn.addEventListener('click', () => {
    if (state.contacts.length === 0) return;
    state.previewIndex = (state.previewIndex - 1 + state.contacts.length) % state.contacts.length;
    updateLivePreview();
  });

  DOM.nextRecipientBtn.addEventListener('click', () => {
    if (state.contacts.length === 0) return;
    state.previewIndex = (state.previewIndex + 1) % state.contacts.length;
    updateLivePreview();
  });

  // Merge tags pill click to insert tag
  DOM.mergeTagsPills.addEventListener('click', (e) => {
    if (e.target.classList.contains('merge-tag-chip')) {
      const tag = e.target.getAttribute('data-tag');
      insertTagIntoActiveField(tag);
    }
  });

  // Test send
  DOM.sendTestEmailBtn.addEventListener('click', async () => {
    const toEmail = DOM.testEmailRecipient.value.trim();
    if (!toEmail || !toEmail.includes('@')) {
      alert('Please enter a valid recipient email for the test.');
      return;
    }

    if (!state.isSmtpVerified && !DOM.smtpPass.value.trim()) {
      alert('Please configure and test your SMTP connection in Step 1 first.');
      return;
    }

    const host = DOM.manualSmtpHost.value.trim() || state.smtp.host;
    const port = parseInt(DOM.manualSmtpPort.value.trim() || state.smtp.port, 10);
    const secure = DOM.manualSmtpSecure.value === 'true';
    const user = DOM.smtpUser.value.trim();
    const pass = DOM.smtpPass.value.trim();
    const senderName = DOM.senderName.value.trim();

    const sampleContact = state.contacts[state.previewIndex] || {
      first_name: 'TestRecipient',
      company: 'Sample Hospital',
      position: 'Director',
      email: toEmail,
    };

    DOM.sendTestEmailBtn.disabled = true;
    DOM.testEmailStatus.classList.remove('hidden');
    DOM.testEmailStatus.innerHTML = 'Sending test email...';

    try {
      const res = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpConfig: { host, port, secure, user, pass },
          senderName,
          toEmail,
          subject: DOM.emailSubject.value,
          bodyHtml: DOM.emailBody.value,
          sampleContact,
        }),
      });
      const data = await res.json();

      if (data.success) {
        DOM.testEmailStatus.innerHTML = `✅ Test email successfully sent to <strong>${toEmail}</strong>!`;
      } else {
        DOM.testEmailStatus.innerHTML = `❌ Failed: ${data.error}`;
      }
    } catch (err) {
      DOM.testEmailStatus.innerHTML = `❌ Error: ${err.message}`;
    } finally {
      DOM.sendTestEmailBtn.disabled = false;
    }
  });
}

function loadTemplatePreset(key) {
  const preset = PRESET_TEMPLATES[key] || PRESET_TEMPLATES.cold_intro;
  DOM.emailSubject.value = preset.subject;
  DOM.emailBody.value = preset.body;
  updateLivePreview();
}

function insertTagIntoActiveField(tag) {
  const bodyField = DOM.emailBody;
  const start = bodyField.selectionStart || bodyField.value.length;
  const end = bodyField.selectionEnd || bodyField.value.length;

  bodyField.value = bodyField.value.substring(0, start) + tag + bodyField.value.substring(end);
  bodyField.focus();
  bodyField.selectionStart = bodyField.selectionEnd = start + tag.length;

  updateLivePreview();
}

function updateMergeTagsBar() {
  const defaultTags = ['first_name', 'last_name', 'company', 'position', 'email'];
  const customTags = state.columns
    .map((c) => c.toLowerCase().replace(/[^a-z0-9_]/g, '_'))
    .filter((c) => !defaultTags.includes(c));

  if (customTags.length > 0) {
    const extraHtml = customTags
      .map((t) => `<button type="button" class="merge-tag-chip" data-tag="{{${t}}}">🏷️ {{${t}}}</button>`)
      .join('');
    DOM.mergeTagsPills.innerHTML = `
      <button type="button" class="merge-tag-chip" data-tag="{{first_name}}">🏷️ {{first_name}}</button>
      <button type="button" class="merge-tag-chip" data-tag="{{last_name}}">🏷️ {{last_name}}</button>
      <button type="button" class="merge-tag-chip" data-tag="{{company}}">🏢 {{company}}</button>
      <button type="button" class="merge-tag-chip" data-tag="{{position}}">💼 {{position}}</button>
      <button type="button" class="merge-tag-chip" data-tag="{{email}}">✉️ {{email}}</button>
      ${extraHtml}
    `;
  }
}

function updateLivePreview() {
  const contacts = state.contacts;
  if (contacts.length === 0) {
    DOM.previewRecipientIndex.textContent = 'No recipients loaded';
    DOM.renderedSubjectText.textContent = DOM.emailSubject.value || '(No subject)';
    DOM.renderedBodyText.textContent = DOM.emailBody.value || '(No body)';
    return;
  }

  const index = Math.min(state.previewIndex, contacts.length - 1);
  const contact = contacts[index];

  DOM.previewRecipientIndex.textContent = `Recipient ${index + 1} of ${contacts.length}`;
  DOM.previewAvatar.textContent = (contact.first_name?.[0] || 'C') + (contact.last_name?.[0] || '');
  DOM.previewName.textContent = contact.name || contact.first_name || 'Recipient';
  DOM.previewEmail.textContent = contact.email;
  DOM.previewCompany.textContent = `${contact.company || 'Company'} • ${contact.position || 'Contact'}`;

  // Interpolate
  const senderName = DOM.senderName.value.trim() || state.smtp.senderName || 'Sender';
  const renderCtx = { ...contact, sender_name: senderName };

  DOM.renderedSubjectText.textContent = substituteVariables(DOM.emailSubject.value, renderCtx);
  DOM.renderedBodyText.textContent = substituteVariables(DOM.emailBody.value, renderCtx);
}

function substituteVariables(text, contact) {
  if (!text) return '';
  return text.replace(/\{\{\s*([a-zA-Z0-9_\-]+)(?:\s*\|\s*([^}]+))?\s*\}\}/g, (match, key, fallback) => {
    const cleanKey = key.trim().toLowerCase();
    const cleanFallback = fallback ? fallback.trim() : '';

    if (cleanKey === 'first_name' || cleanKey === 'firstname' || cleanKey === 'fname') {
      return contact.first_name || cleanFallback || 'there';
    }
    if (cleanKey === 'last_name' || cleanKey === 'lastname' || cleanKey === 'lname') {
      return contact.last_name || cleanFallback || '';
    }
    if (cleanKey === 'name' || cleanKey === 'fullname') {
      return contact.name || cleanFallback || contact.first_name || 'Friend';
    }
    if (cleanKey === 'company' || cleanKey === 'company_name') {
      return contact.company || cleanFallback || '';
    }
    if (cleanKey === 'position' || cleanKey === 'title') {
      return contact.position || cleanFallback || '';
    }
    if (cleanKey === 'email') {
      return contact.email || cleanFallback || '';
    }
    if (cleanKey === 'sender_name') {
      return contact.sender_name || '';
    }

    return contact[cleanKey] || cleanFallback || match;
  });
}

// ============================================================================
// 4. CAMPAIGN DISPATCH & LIVE REAL-TIME SSE LOG
// ============================================================================
function updateCampaignSummary() {
  DOM.summaryTotalRecipients.textContent = state.contacts.length;
  DOM.summaryFromEmail.textContent = DOM.smtpUser.value.trim() || 'Not Configured';
  DOM.summarySmtpHost.textContent = DOM.manualSmtpHost.value.trim() || state.smtp.host || 'Not Configured';

  DOM.statTotalCount.textContent = state.contacts.length;
  DOM.statSentCount.textContent = '0';
  DOM.statFailedCount.textContent = '0';
  DOM.progressPercentText.textContent = '0%';
  DOM.progressBarFill.style.width = '0%';
}

function setupCampaignControls() {
  DOM.startCampaignBtn.addEventListener('click', startCampaign);

  DOM.pauseCampaignBtn.addEventListener('click', async () => {
    await fetch('/api/campaign/pause', { method: 'POST' });
    DOM.pauseCampaignBtn.classList.add('hidden');
    DOM.resumeCampaignBtn.classList.remove('hidden');
  });

  DOM.resumeCampaignBtn.addEventListener('click', async () => {
    await fetch('/api/campaign/resume', { method: 'POST' });
    DOM.resumeCampaignBtn.classList.add('hidden');
    DOM.pauseCampaignBtn.classList.remove('hidden');
  });

  DOM.stopCampaignBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to stop the campaign?')) {
      await fetch('/api/campaign/stop', { method: 'POST' });
      DOM.pauseCampaignBtn.classList.add('hidden');
      DOM.resumeCampaignBtn.classList.add('hidden');
      DOM.stopCampaignBtn.classList.add('hidden');
      DOM.startCampaignBtn.classList.remove('hidden');
    }
  });

  DOM.exportResultsBtn.addEventListener('click', exportCampaignCsv);
}

async function startCampaign() {
  if (state.contacts.length === 0) {
    alert('Please add recipients in Step 2 before starting the campaign.');
    goToStep(2);
    return;
  }

  const host = DOM.manualSmtpHost.value.trim() || state.smtp.host;
  const port = parseInt(DOM.manualSmtpPort.value.trim() || state.smtp.port, 10);
  const secure = DOM.manualSmtpSecure.value === 'true';
  const user = DOM.smtpUser.value.trim();
  const pass = DOM.smtpPass.value.trim();
  const senderName = DOM.senderName.value.trim();
  const delayMs = parseInt(DOM.campaignDelaySelect.value, 10) || 2000;

  if (!host || !port || !user || !pass) {
    alert('Missing SMTP credentials. Please complete Step 1 first.');
    goToStep(1);
    return;
  }

  const subject = DOM.emailSubject.value.trim();
  const body = DOM.emailBody.value.trim();

  if (!subject || !body) {
    alert('Please provide an email subject and body in Step 3.');
    goToStep(3);
    return;
  }

  // Toggle buttons
  DOM.startCampaignBtn.classList.add('hidden');
  DOM.pauseCampaignBtn.classList.remove('hidden');
  DOM.stopCampaignBtn.classList.remove('hidden');
  DOM.exportResultsBtn.disabled = true;

  // Initialize delivery table
  initDeliveryTable(state.contacts);

  // Connect SSE
  connectCampaignSse();

  // Start campaign via API
  try {
    const res = await fetch('/api/campaign/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        smtpConfig: { host, port, secure, user, pass },
        senderName,
        subject,
        body,
        recipients: state.contacts,
        delayMs,
      }),
    });
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to start campaign');
    }
  } catch (err) {
    alert('Could not start campaign: ' + err.message);
    DOM.startCampaignBtn.classList.remove('hidden');
    DOM.pauseCampaignBtn.classList.add('hidden');
    DOM.stopCampaignBtn.classList.add('hidden');
  }
}

function connectCampaignSse() {
  if (state.sseSource) {
    state.sseSource.close();
  }

  const source = new EventSource('/api/campaign/stream');
  state.sseSource = source;

  source.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      updateCampaignProgress(data);
    } catch (e) {
      console.error('SSE JSON error:', e);
    }
  };

  source.onerror = () => {
    // SSE error or stream closed
  };
}

function updateCampaignProgress(data) {
  state.campaign = data;

  DOM.statSentCount.textContent = data.sentCount || 0;
  DOM.statFailedCount.textContent = data.failedCount || 0;
  DOM.statTotalCount.textContent = data.total || 0;
  DOM.progressPercentText.textContent = `${data.progressPercent || 0}%`;
  DOM.progressBarFill.style.width = `${data.progressPercent || 0}%`;

  if (data.recipients && Array.isArray(data.recipients)) {
    updateDeliveryTableRows(data.recipients);
  }

  if (data.status === 'completed' || data.status === 'stopped') {
    DOM.pauseCampaignBtn.classList.add('hidden');
    DOM.resumeCampaignBtn.classList.add('hidden');
    DOM.stopCampaignBtn.classList.add('hidden');
    DOM.startCampaignBtn.classList.remove('hidden');
    DOM.exportResultsBtn.disabled = false;

    if (state.sseSource) {
      state.sseSource.close();
      state.sseSource = null;
    }
  }
}

function initDeliveryTable(contacts) {
  const tbody = DOM.deliveryTableBody;
  tbody.innerHTML = contacts
    .map(
      (c, idx) => `
      <tr id="deliveryRow_${c.id}">
        <td class="code">${idx + 1}</td>
        <td><strong>${escapeHtml(c.first_name || 'Contact')} ${escapeHtml(c.last_name || '')}</strong></td>
        <td class="code">${escapeHtml(c.email)}</td>
        <td>${escapeHtml(c.company || '-')}</td>
        <td class="status-cell">
          <span class="badge">⚪ Queued</span>
        </td>
        <td class="detail-cell text-muted">Awaiting dispatch</td>
      </tr>
    `
    )
    .join('');
}

function updateDeliveryTableRows(recipients) {
  let hasGoogleAuthError = false;
  let hasFailed = false;

  recipients.forEach((r) => {
    const row = document.getElementById(`deliveryRow_${r.id}`);
    if (!row) return;

    const statusCell = row.querySelector('.status-cell');
    const detailCell = row.querySelector('.detail-cell');

    if (r.status === 'sent') {
      statusCell.innerHTML = `<span class="badge badge-success">🟢 Sent</span>`;
      detailCell.innerHTML = `<span class="text-success">${new Date(r.sentAt).toLocaleTimeString()}</span>`;
    } else if (r.status === 'failed') {
      hasFailed = true;
      statusCell.innerHTML = `<span class="badge badge-danger">🔴 Failed</span>`;
      detailCell.innerHTML = `<span class="text-danger">${escapeHtml(r.error || 'Failed')}</span>`;

      if (
        r.isGoogleAuthError ||
        (r.error && (
          r.error.includes('Google App Password') ||
          r.error.includes('534-5.7.9') ||
          r.error.includes('Application-specific password')
        ))
      ) {
        hasGoogleAuthError = true;
      }
    } else if (r.status === 'sending') {
      statusCell.innerHTML = `<span class="badge badge-warning">🟡 Sending...</span>`;
      detailCell.textContent = 'Connecting to mailbox...';
    }
  });

  const helpBox = document.getElementById('googleAppPasswordHelpBox');
  if (helpBox) {
    helpBox.classList.toggle('hidden', !hasGoogleAuthError);
  }

  const retryBtn = document.getElementById('retryFailedBtn');
  if (retryBtn) {
    retryBtn.classList.toggle('hidden', !hasFailed);
    if (!retryBtn.dataset.bound) {
      retryBtn.dataset.bound = 'true';
      retryBtn.addEventListener('click', () => {
        // Find failed contacts and retry them
        const failedRecipients = state.campaign.recipients.filter(r => r.status === 'failed');
        if (failedRecipients.length > 0) {
          state.contacts = failedRecipients.map((f, idx) => ({ ...f, id: idx + 1, status: 'pending', error: null }));
          startCampaign();
        } else {
          startCampaign();
        }
      });
    }
  }
}

function exportCampaignCsv() {
  const recipients = state.campaign.recipients;
  if (!recipients || recipients.length === 0) {
    alert('No campaign delivery data to export.');
    return;
  }

  const headers = ['First Name', 'Last Name', 'Email', 'Company', 'Position', 'Status', 'Sent At', 'Error'];
  const rows = recipients.map((r) => [
    `"${(r.first_name || '').replace(/"/g, '""')}"`,
    `"${(r.last_name || '').replace(/"/g, '""')}"`,
    `"${(r.email || '').replace(/"/g, '""')}"`,
    `"${(r.company || '').replace(/"/g, '""')}"`,
    `"${(r.position || '').replace(/"/g, '""')}"`,
    `"${r.status}"`,
    `"${r.sentAt || ''}"`,
    `"${(r.error || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `campaign_delivery_report_${Date.now()}.csv`;
  a.click();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================================
// 5. NOVOTION AI AGENT COPILOT & ACCOUNT LOGIN
// ============================================================================
// ============================================================================
// 5. NOVOTION AI AGENT COPILOT & UNIVERSAL MULTI-MODEL SYSTEM
// ============================================================================
function setupAiAgentSystem() {
  updateAiHeaderStatus();

  // Header AI pill click opens account modal
  DOM.headerAiPill.addEventListener('click', openAiAccountModal);

  // Switch model from drawer
  if (DOM.switchModelFromDrawerBtn) {
    DOM.switchModelFromDrawerBtn.addEventListener('click', () => {
      closeAiDrawer();
      openAiAccountModal();
    });
  }

  // Launch Drawer buttons
  const openDrawerHandler = () => {
    if (!state.ai.apiKey && state.ai.provider !== 'custom') {
      openAiAccountModal();
    } else {
      openAiDrawer();
    }
  };
  DOM.launchAiDrawerBtn.addEventListener('click', openDrawerHandler);
  DOM.openAiDrawerFromStep3Btn.addEventListener('click', openDrawerHandler);

  // Close Drawer
  DOM.closeAiDrawerBtn.addEventListener('click', closeAiDrawer);
  DOM.aiDrawerOverlay.addEventListener('click', closeAiDrawer);

  // Close Modal
  DOM.closeAiAccountModalBtn.addEventListener('click', closeAiAccountModal);
  DOM.cancelAiAccountModalBtn.addEventListener('click', closeAiAccountModal);

  // Toggle API key visibility
  DOM.toggleAiKeyBtn.addEventListener('click', () => {
    const isPass = DOM.aiApiKeyInput.type === 'password';
    DOM.aiApiKeyInput.type = isPass ? 'text' : 'password';
    DOM.toggleAiKeyBtn.textContent = isPass ? '🔒' : '👁️';
  });

  // Provider dropdown change
  DOM.aiProviderSelect.addEventListener('change', (e) => {
    onAiProviderChanged(e.target.value);
  });

  // Save AI Account
  DOM.saveAiAccountBtn.addEventListener('click', verifyAndSaveAiAccount);

  // Disconnect AI Account
  DOM.disconnectAiKeyBtn.addEventListener('click', disconnectAiAccount);

  // Agent Persona Tabs
  DOM.agentPillBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      DOM.agentPillBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const agent = btn.getAttribute('data-agent');
      switchAgentPersona(agent);
    });
  });

  // Execute AI Agent
  DOM.executeAiAgentBtn.addEventListener('click', executeAiAgentGeneration);

  // Apply to Template
  DOM.applyAiToTemplateBtn.addEventListener('click', applyAiOutputToTemplate);

  // Copy output
  DOM.copyAiOutputBtn.addEventListener('click', () => {
    const text = DOM.agentOutputContent.textContent;
    navigator.clipboard.writeText(text);
    DOM.copyAiOutputBtn.textContent = '✅ Copied!';
    setTimeout(() => (DOM.copyAiOutputBtn.textContent = '📋 Copy'), 2000);
  });
}

function getModelDisplayName(provider, modelId, customModel) {
  if (provider === 'custom') {
    return customModel || 'Custom LLM';
  }
  const list = AI_MODELS[provider] || [];
  const found = list.find((m) => m.id === modelId);
  if (found) {
    // Return clean shortened name
    return found.name.split(' (')[0];
  }
  return modelId || provider.toUpperCase();
}

function updateAiHeaderStatus() {
  if (state.ai.apiKey || state.ai.provider === 'custom') {
    const displayName = getModelDisplayName(state.ai.provider, state.ai.model, state.ai.customModel);
    DOM.aiStatusDot.className = 'status-dot connected';
    DOM.aiStatusLabel.textContent = `🟢 AI: ${displayName}`;
    DOM.drawerAiBadge.textContent = displayName;
    DOM.disconnectAiKeyBtn.classList.remove('hidden');
  } else {
    DOM.aiStatusDot.className = 'status-dot disconnected';
    DOM.aiStatusLabel.textContent = '🤖 AI: Connect Account';
    DOM.drawerAiBadge.textContent = 'Not Connected';
    DOM.disconnectAiKeyBtn.classList.add('hidden');
  }
}

function populateAiModelSelect(provider, selectedModel) {
  const models = AI_MODELS[provider] || [];
  DOM.aiModelSelect.innerHTML = models
    .map((m) => `<option value="${m.id}" ${m.id === selectedModel ? 'selected' : ''}>${m.name}</option>`)
    .join('');
}

function onAiProviderChanged(provider) {
  populateAiModelSelect(provider);
  updateAiProviderHint(provider);

  if (provider === 'custom') {
    DOM.customBaseUrlGroup.classList.remove('hidden');
    DOM.customModelGroup.classList.remove('hidden');
    DOM.aiApiKeyRequiredStar.classList.add('hidden');
    DOM.aiApiKeyInput.placeholder = 'Optional for local Ollama / LM Studio (or enter Bearer token)';
    if (!DOM.aiBaseUrlInput.value) {
      DOM.aiBaseUrlInput.value = 'http://localhost:11434/v1';
    }
  } else {
    DOM.customBaseUrlGroup.classList.add('hidden');
    DOM.customModelGroup.classList.add('hidden');
    DOM.aiApiKeyRequiredStar.classList.remove('hidden');
  }
}

function openAiAccountModal() {
  const currentProvider = state.ai.provider || 'gemini';
  DOM.aiProviderSelect.value = currentProvider;
  populateAiModelSelect(currentProvider, state.ai.model);

  DOM.aiCustomModelInput.value = state.ai.customModel || '';
  DOM.aiBaseUrlInput.value = state.ai.baseUrl || (currentProvider === 'custom' ? 'http://localhost:11434/v1' : '');
  DOM.aiApiKeyInput.value = state.ai.apiKey || '';

  onAiProviderChanged(currentProvider);

  DOM.aiAuthAlertBox.classList.add('hidden');
  DOM.aiAccountModal.classList.remove('hidden');
}

function closeAiAccountModal() {
  DOM.aiAccountModal.classList.add('hidden');
}

function updateAiProviderHint(provider) {
  if (provider === 'gemini') {
    DOM.aiKeyHintBox.innerHTML = `💡 <strong>Google Gemini:</strong> Free for developers & startups. Choose between Gemini 2.5 Flash, 2.5 Pro, or 3.7 Flash. Get your free key in 10 seconds at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" style="color:var(--primary); font-weight:700;">aistudio.google.com</a>.`;
    DOM.aiApiKeyInput.placeholder = 'AIzaSy...';
  } else if (provider === 'openai') {
    DOM.aiKeyHintBox.innerHTML = `💡 <strong>OpenAI:</strong> Use GPT-4o, GPT-4o Mini, or o3-mini. Get your key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" style="color:var(--primary); font-weight:700;">platform.openai.com/api-keys</a>.`;
    DOM.aiApiKeyInput.placeholder = 'sk-proj-...';
  } else if (provider === 'claude') {
    DOM.aiKeyHintBox.innerHTML = `💡 <strong>Anthropic Claude:</strong> Powered by Claude 3.7 Sonnet & Claude 3.5 Sonnet. Get your key at <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" style="color:var(--primary); font-weight:700;">console.anthropic.com</a>.`;
    DOM.aiApiKeyInput.placeholder = 'sk-ant-api03-...';
  } else if (provider === 'groq') {
    DOM.aiKeyHintBox.innerHTML = `💡 <strong>Groq:</strong> Ultra-fast inference running Llama 3.3 70B & DeepSeek R1. Get your free API key at <a href="https://console.groq.com/keys" target="_blank" rel="noopener" style="color:var(--primary); font-weight:700;">console.groq.com/keys</a>.`;
    DOM.aiApiKeyInput.placeholder = 'gsk_...';
  } else if (provider === 'custom') {
    DOM.aiKeyHintBox.innerHTML = `💡 <strong>Custom OpenAI-Standard / Ollama / OpenRouter:</strong> Connect any local Ollama (<code>http://localhost:11434/v1</code>), LM Studio, vLLM, or OpenRouter endpoint. API Key is optional for local servers.`;
  }
}

async function verifyAndSaveAiAccount() {
  const provider = DOM.aiProviderSelect.value;
  let model = DOM.aiModelSelect.value;
  const customModel = DOM.aiCustomModelInput.value.trim();
  const baseUrl = DOM.aiBaseUrlInput.value.trim();
  const apiKey = DOM.aiApiKeyInput.value.trim();

  if (provider === 'custom') {
    model = customModel || 'custom-model';
  }

  if (!apiKey && provider !== 'custom') {
    showAiAlert('Please paste your API key to connect.', 'error');
    return;
  }

  const btnSpinner = DOM.saveAiAccountBtn.querySelector('.btn-spinner');
  const btnText = DOM.saveAiAccountBtn.querySelector('.btn-text');

  btnSpinner.classList.remove('hidden');
  btnText.textContent = 'Verifying model & key...';
  DOM.saveAiAccountBtn.disabled = true;

  try {
    const res = await fetch('/api/ai/test-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey, model, baseUrl }),
    });
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || 'Verification failed');
    }

    // Save to state and localStorage
    state.ai.provider = provider;
    state.ai.model = model;
    state.ai.customModel = customModel;
    state.ai.baseUrl = baseUrl;
    state.ai.apiKey = apiKey;
    state.ai.isConfigured = true;

    localStorage.setItem('novotion_ai_provider', provider);
    localStorage.setItem('novotion_ai_model', model);
    localStorage.setItem('novotion_ai_custom_model', customModel);
    localStorage.setItem('novotion_ai_base_url', baseUrl);
    localStorage.setItem('novotion_ai_key', apiKey);

    updateAiHeaderStatus();
    showAiAlert(`✅ ${data.message}`, 'success');

    setTimeout(() => {
      closeAiAccountModal();
      openAiDrawer();
    }, 900);
  } catch (err) {
    showAiAlert(`❌ ${err.message}`, 'error');
  } finally {
    btnSpinner.classList.add('hidden');
    btnText.textContent = 'Verify & Activate Model';
    DOM.saveAiAccountBtn.disabled = false;
  }
}

function disconnectAiAccount() {
  if (confirm('Disconnect AI account and reset active model?')) {
    state.ai.apiKey = '';
    state.ai.isConfigured = false;
    localStorage.removeItem('novotion_ai_key');
    updateAiHeaderStatus();
    closeAiAccountModal();
  }
}

function showAiAlert(msg, type) {
  DOM.aiAuthAlertBox.textContent = msg;
  DOM.aiAuthAlertBox.className = `alert-box ${type}`;
  DOM.aiAuthAlertBox.classList.remove('hidden');
}

function openAiDrawer() {
  DOM.aiDrawerOverlay.classList.remove('hidden');
  DOM.aiAgentDrawer.classList.remove('hidden');

  // Auto-populate context from contacts if available
  if (state.contacts.length > 0 && !DOM.aiAudienceContext.value.trim()) {
    const sample = state.contacts.slice(0, 3);
    const companies = sample.map((c) => c.company).filter(Boolean).join(', ');
    const titles = sample.map((c) => c.position).filter(Boolean).join(', ');
    DOM.aiAudienceContext.value = `Leaders including ${titles || 'Decision Makers'} at ${companies || 'Target Accounts'}`;
  }
}

function closeAiDrawer() {
  DOM.aiDrawerOverlay.classList.add('hidden');
  DOM.aiAgentDrawer.classList.add('hidden');
}

function switchAgentPersona(agent) {
  state.ai.activeAgent = agent;

  if (agent === 'tone_rewrite') {
    DOM.toneGroup.style.display = 'flex';
    DOM.toneGroup.classList.remove('hidden');
    DOM.aiPromptLabel.textContent = 'Original Draft / Specific Adjustments';
    DOM.aiPromptInput.value = DOM.emailBody.value || '';
  } else if (agent === 'subject_optimizer') {
    DOM.toneGroup.style.display = 'none';
    DOM.aiPromptLabel.textContent = 'What is the core offer or hook of this email?';
  } else if (agent === 'follow_up') {
    DOM.toneGroup.style.display = 'none';
    DOM.aiPromptLabel.textContent = 'What was the initial outreach offer?';
  } else {
    // outreach
    DOM.toneGroup.style.display = 'none';
    DOM.aiPromptLabel.textContent = 'What are you offering / pitching?';
  }
}

async function executeAiAgentGeneration() {
  if (!state.ai.apiKey && state.ai.provider !== 'custom') {
    openAiAccountModal();
    return;
  }

  const agentType = state.ai.activeAgent;
  const prompt = DOM.aiPromptInput.value.trim();
  const audienceContext = DOM.aiAudienceContext.value.trim();
  const tone = DOM.aiToneSelect.value;
  const currentDraft = DOM.emailBody.value.trim();

  const btnSpinner = DOM.executeAiAgentBtn.querySelector('.btn-spinner');
  const btnText = DOM.executeAiAgentBtn.querySelector('.btn-text');

  btnSpinner.classList.remove('hidden');
  btnText.textContent = 'Agent Thinking & Crafting...';
  DOM.executeAiAgentBtn.disabled = true;

  try {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: state.ai.provider,
        model: state.ai.model,
        baseUrl: state.ai.baseUrl,
        apiKey: state.ai.apiKey,
        agentType,
        prompt,
        currentDraft,
        tone,
        audienceContext,
      }),
    });
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || 'Generation failed');
    }

    state.ai.lastResult = data.result;
    renderAiAgentOutput(data);
  } catch (err) {
    alert('AI Generation Error: ' + err.message);
  } finally {
    btnSpinner.classList.add('hidden');
    btnText.textContent = 'Generate with AI Agent';
    DOM.executeAiAgentBtn.disabled = false;
  }
}

function renderAiAgentOutput(data) {
  DOM.agentOutputBox.classList.remove('hidden');
  const result = data.result;
  const agentType = data.agentType;

  DOM.outputModelBadge.textContent = `${data.provider.toUpperCase()} Agent`;

  if (agentType === 'outreach' || agentType === 'tone_rewrite') {
    if (result && result.subject && result.body) {
      DOM.agentOutputContent.innerHTML = `<strong>Subject:</strong> ${escapeHtml(result.subject)}\n\n<strong>Email Body:</strong>\n${escapeHtml(result.body)}`;
    } else {
      DOM.agentOutputContent.textContent = data.raw;
    }
  } else if (agentType === 'subject_optimizer') {
    if (result && Array.isArray(result.subjects)) {
      const list = result.subjects
        .map((s, idx) => `<div style="margin-bottom:8px; padding:6px 10px; background:rgba(255,255,255,0.04); border-radius:6px; cursor:pointer;" onclick="selectGeneratedSubject('${escapeHtml(s).replace(/'/g, "\\'")}')"><strong>${idx + 1}.</strong> ${escapeHtml(s)} <span style="font-size:0.75rem; color:var(--accent-cyan); float:right;">Click to select</span></div>`)
        .join('');
      DOM.agentOutputContent.innerHTML = `<p style="margin-bottom:10px; font-size:0.8rem; color:var(--text-muted);">Click any subject line to use it:</p>${list}`;
    } else {
      DOM.agentOutputContent.textContent = data.raw;
    }
  } else if (agentType === 'follow_up') {
    if (result && Array.isArray(result.steps)) {
      const stepsHtml = result.steps
        .map(
          (st) => `
        <div style="margin-bottom:14px; padding:10px; background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:8px;">
          <span class="badge badge-success" style="margin-bottom:6px;">Step ${st.step}: ${escapeHtml(st.timing || '')}</span>
          <p><strong>Subject:</strong> ${escapeHtml(st.subject || '')}</p>
          <p style="margin-top:6px; white-space:pre-wrap;">${escapeHtml(st.body || '')}</p>
        </div>`
        )
        .join('');
      DOM.agentOutputContent.innerHTML = stepsHtml;
    } else {
      DOM.agentOutputContent.textContent = data.raw;
    }
  }
}

function selectGeneratedSubject(subj) {
  DOM.emailSubject.value = subj;
  goToStep(3);
  updateLivePreview();
  alert(`Applied subject line: "${subj}"`);
}

function applyAiOutputToTemplate() {
  const result = state.ai.lastResult;
  if (!result) return;

  if (result.subject) {
    DOM.emailSubject.value = result.subject;
  }
  if (result.body) {
    DOM.emailBody.value = result.body;
  }

  // If follow-up sequence with steps, load step 1
  if (Array.isArray(result.steps) && result.steps[0]) {
    DOM.emailSubject.value = result.steps[0].subject || DOM.emailSubject.value;
    DOM.emailBody.value = result.steps[0].body || DOM.emailBody.value;
  }

  closeAiDrawer();
  goToStep(3);
  updateLivePreview();
  alert('✨ AI email & subject successfully inserted into your template!');
}

