import React, { useState, useEffect } from 'react';
import { SetupHeader } from './SetupHeader.js';
import { ProfilePresetsPanel } from './ProfilePresetsPanel.js';
import { SmtpConfigCard } from './SmtpConfigCard.js';
import {
  SmtpProviderType,
  SmtpConfig,
  ImapConfig,
  SavedSmtpSession,
  ConnectionLog,
} from './types.js';
import {
  Sparkles,
  X,
  Upload,
  Bot,
  FileSpreadsheet,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';

const DEFAULT_SMTP_CONFIG: SmtpConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  security: 'TLS',
  username: '',
  password: '',
  senderName: 'Novotion Outreach',
  replyTo: '',
};

const DEFAULT_IMAP_CONFIG: ImapConfig = {
  host: 'imap.gmail.com',
  port: 993,
  security: 'SSL',
  username: '',
  password: '',
  enabled: false,
};

export const EmailAutomationSetup: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [activeProvider, setActiveProvider] = useState<SmtpProviderType>('google');
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(DEFAULT_SMTP_CONFIG);
  const [imapConfig, setImapConfig] = useState<ImapConfig>(DEFAULT_IMAP_CONFIG);
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>('1');

  const [savedSessions, setSavedSessions] = useState<SavedSmtpSession[]>(() => {
    try {
      const stored = localStorage.getItem('novotion_saved_smtp_sessions');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [
      {
        id: '1',
        name: 'Workspace Primary (Gmail)',
        provider: 'google',
        smtp: {
          host: 'smtp.gmail.com',
          port: 587,
          security: 'TLS',
          username: 'team@novotionservices.com',
          password: '••••••••••••••••',
          senderName: 'Novotion Outreach Team',
          replyTo: 'contact@novotionservices.com',
        },
        savedAt: '2026-09-18',
      },
      {
        id: '2',
        name: 'Enterprise M365 Outreach',
        provider: 'microsoft',
        smtp: {
          host: 'smtp.office365.com',
          port: 587,
          security: 'STARTTLS',
          username: 'campaigns@novotionservices.com',
          password: '••••••••••••••••',
          senderName: 'Novotion Sales Hub',
          replyTo: '',
        },
        savedAt: '2026-09-19',
      },
    ];
  });

  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number | undefined>(undefined);
  const [logs, setLogs] = useState<ConnectionLog[]>([]);
  const [aiCopilotOpen, setAiCopilotOpen] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedAiModel, setSelectedAiModel] = useState('Claude 3.5 Sonnet');

  // Toggle Theme & sync HTML tag
  const handleToggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Keyboard shortcut for AI Copilot (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setAiCopilotOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Provider preset selection
  const handleSelectProvider = (provider: SmtpProviderType) => {
    setActiveProvider(provider);
    setSelectedSessionId(undefined);
    if (provider === 'google') {
      setSmtpConfig((prev) => ({
        ...prev,
        host: 'smtp.gmail.com',
        port: 587,
        security: 'TLS',
      }));
      setImapConfig((prev) => ({
        ...prev,
        host: 'imap.gmail.com',
        port: 993,
        security: 'SSL',
      }));
    } else if (provider === 'microsoft') {
      setSmtpConfig((prev) => ({
        ...prev,
        host: 'smtp.office365.com',
        port: 587,
        security: 'STARTTLS',
      }));
      setImapConfig((prev) => ({
        ...prev,
        host: 'outlook.office365.com',
        port: 993,
        security: 'SSL',
      }));
    } else {
      setSmtpConfig((prev) => ({
        ...prev,
        host: '',
        port: 587,
        security: 'TLS',
      }));
    }
  };

  // Auto-detect DNS/MX domain
  const handleAutoDetect = (query: string) => {
    const domain = query.includes('@') ? query.split('@')[1].toLowerCase() : query.toLowerCase();

    if (domain.includes('gmail') || domain.includes('google')) {
      handleSelectProvider('google');
      if (query.includes('@')) {
        setSmtpConfig((prev) => ({ ...prev, username: query }));
      }
    } else if (domain.includes('outlook') || domain.includes('office') || domain.includes('microsoft')) {
      handleSelectProvider('microsoft');
      if (query.includes('@')) {
        setSmtpConfig((prev) => ({ ...prev, username: query }));
      }
    } else {
      setActiveProvider('custom');
      setSmtpConfig((prev) => ({
        ...prev,
        host: `mail.${domain}`,
        port: 587,
        security: 'TLS',
        username: query.includes('@') ? query : prev.username,
      }));
      setImapConfig((prev) => ({
        ...prev,
        host: `mail.${domain}`,
        port: 993,
        security: 'SSL',
      }));
    }
  };

  // Save session profile
  const handleSaveProfile = (name: string) => {
    const newSession: SavedSmtpSession = {
      id: Date.now().toString(),
      name,
      provider: activeProvider,
      smtp: { ...smtpConfig },
      imap: { ...imapConfig },
      savedAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newSession, ...savedSessions];
    setSavedSessions(updated);
    setSelectedSessionId(newSession.id);
    try {
      localStorage.setItem('novotion_saved_smtp_sessions', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleLoadSession = (session: SavedSmtpSession) => {
    setActiveProvider(session.provider);
    setSmtpConfig(session.smtp);
    if (session.imap) {
      setImapConfig(session.imap);
    }
    setSelectedSessionId(session.id);
    setIsConnected(false);
  };

  // Test connection simulation / execution
  const handleTestConnection = () => {
    setIsTesting(true);
    setIsConnected(false);
    setLogs([]);

    const timestamp = () => new Date().toLocaleTimeString();

    const addLog = (msg: string, type: ConnectionLog['type'] = 'info', latency?: number) => {
      setLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          timestamp: timestamp(),
          message: msg,
          type,
          latencyMs: latency,
        },
      ]);
    };

    addLog(`Resolving DNS for ${smtpConfig.host || 'smtp.gmail.com'}...`);

    setTimeout(() => {
      addLog(`Connected to host on port ${smtpConfig.port}`, 'info', 24);
    }, 300);

    setTimeout(() => {
      addLog(`TLS 1.3 encrypted channel established`, 'info', 38);
    }, 650);

    setTimeout(() => {
      if (!smtpConfig.username || !smtpConfig.password) {
        addLog(`AUTH FAILED: Username and password credentials are required`, 'error');
        setIsTesting(false);
        setIsConnected(false);
      } else {
        addLog(`AUTH SUCCESS: Logged in as ${smtpConfig.username}`, 'success', 42);
        setIsTesting(false);
        setIsConnected(true);
        setLatencyMs(42);
      }
    }, 1100);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* 1. Slim Top Bar & Compact Stepper */}
      <SetupHeader
        darkMode={darkMode}
        onToggleTheme={handleToggleTheme}
        smtpConnected={isConnected}
        smtpUsername={smtpConfig.username}
        currentStep={currentStep}
        onStepClick={(step) => setCurrentStep(step)}
        onOpenAiCopilot={() => setAiCopilotOpen(true)}
      />

      {/* 2. Main Content Container (Single Viewport natural fit) */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {currentStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (4 columns / lg:col-span-4): Context & Presets */}
            <div className="lg:col-span-4">
              <ProfilePresetsPanel
                activeProvider={activeProvider}
                onSelectProvider={handleSelectProvider}
                savedSessions={savedSessions}
                onLoadSession={handleLoadSession}
                selectedSessionId={selectedSessionId}
              />
            </div>

            {/* Right Column (8 columns / lg:col-span-8): Connection Setup Form */}
            <div className="lg:col-span-8">
              <SmtpConfigCard
                smtp={smtpConfig}
                imap={imapConfig}
                onChangeSmtp={(field, val) =>
                  setSmtpConfig((prev) => ({ ...prev, [field]: val }))
                }
                onChangeImap={(field, val) =>
                  setImapConfig((prev) => ({ ...prev, [field]: val }))
                }
                onAutoDetect={handleAutoDetect}
                isTesting={isTesting}
                isConnected={isConnected}
                latencyMs={latencyMs}
                logs={logs}
                onTestConnection={handleTestConnection}
                onContinue={() => setCurrentStep(2)}
                onSaveProfile={handleSaveProfile}
              />
            </div>
          </div>
        )}

        {/* Step 2: Audience & Leads */}
        {currentStep === 2 && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-8 text-center max-w-2xl mx-auto">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4">
              <Upload className="h-6 w-6" />
            </div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
              Import Leads & Custom Variables
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
              Upload your prospect CSV or select from your active Novotion lead lists.
            </p>

            <div className="mt-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-8 hover:border-indigo-500 transition-colors cursor-pointer">
              <FileSpreadsheet className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                Click to browse or drag & drop CSV file
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Supported columns: Email, First Name, Company, Title, LinkedIn URL
              </p>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Mailbox
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="h-10 px-5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm"
              >
                Next: AI Generation →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: AI Generation */}
        {currentStep === 3 && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-8 text-center max-w-2xl mx-auto">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
              AI Personalization & Dynamic Prompts
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
              Synthesize icebreakers, personalized pain points, and natural CTAs using your selected LLM.
            </p>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Audience
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="h-10 px-5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm"
              >
                Next: Review & Launch →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Launch */}
        {currentStep === 4 && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-8 text-center max-w-2xl mx-auto">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
              Campaign Pre-Flight Checklist
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
              Gateway: <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{smtpConfig.username || 'Authenticated SMTP'}</span>. Ready to launch.
            </p>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <button
                type="button"
                onClick={() => alert('Campaign initiated via authenticated SMTP relay!')}
                className="h-10 px-6 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm"
              >
                Dispatch Campaign 🚀
              </button>
            </div>
          </div>
        )}
      </main>

      {/* AI Copilot Quick Dialog */}
      {aiCopilotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Outreach AI Copilot
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Write high-converting cold email sequences
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAiCopilotOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Model
                </label>
                <select
                  value={selectedAiModel}
                  onChange={(e) => setSelectedAiModel(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                >
                  <option>Claude 3.5 Sonnet (Recommended)</option>
                  <option>OpenAI GPT-4o</option>
                  <option>Google Gemini 1.5 Pro</option>
                  <option>DeepSeek R1</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Prompt
                </label>
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Draft a 3-sentence outreach email to VP of Sales highlighting a 25% conversion lift..."
                  className="w-full p-3 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-zinc-400">Press Esc to close</span>
                <button
                  type="button"
                  onClick={() => {
                    alert(`Generating email copy with ${selectedAiModel}...`);
                    setAiCopilotOpen(false);
                  }}
                  className="h-9 px-4 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Generate Copy</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
