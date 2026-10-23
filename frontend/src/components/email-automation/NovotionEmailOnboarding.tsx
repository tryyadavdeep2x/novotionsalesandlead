import React, { useState } from 'react';
import {
  Layers,
  Settings,
  Check,
  Search,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldAlert,
  Send,
  Inbox,
  RefreshCw,
  ArrowRight,
  Terminal,
  Cloud,
  Server,
  Mail,
  Lock,
  User,
  CheckCircle2,
} from 'lucide-react';

type ProviderType = 'google' | 'microsoft' | 'ses' | 'custom';
type SecurityProtocol = 'TLS' | 'SSL' | 'STARTTLS';

interface SmtpCredentials {
  host: string;
  port: number;
  security: SecurityProtocol;
  username: string;
  password: string;
  senderName: string;
  replyTo: string;
}

interface ImapCredentials {
  host: string;
  port: number;
  security: SecurityProtocol;
  username: string;
  password: string;
  enabled: boolean;
}

interface SavedProfile {
  id: string;
  name: string;
  provider: ProviderType;
  smtp: SmtpCredentials;
  imap: ImapCredentials;
}

const DEFAULT_PROFILES: SavedProfile[] = [
  {
    id: '1',
    name: 'Primary Google Workspace (Production)',
    provider: 'google',
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      security: 'TLS',
      username: 'outreach@novotionservices.com',
      password: '••••••••••••••••',
      senderName: 'Alex Morgan | Novotion',
      replyTo: 'contact@novotionservices.com',
    },
    imap: {
      host: 'imap.gmail.com',
      port: 993,
      security: 'SSL',
      username: 'outreach@novotionservices.com',
      password: '••••••••••••••••',
      enabled: true,
    },
  },
  {
    id: '2',
    name: 'Enterprise Exchange (Microsoft 365)',
    provider: 'microsoft',
    smtp: {
      host: 'smtp.office365.com',
      port: 587,
      security: 'STARTTLS',
      username: 'campaigns@novotionservices.com',
      password: '••••••••••••••••',
      senderName: 'Novotion Growth Team',
      replyTo: '',
    },
    imap: {
      host: 'outlook.office365.com',
      port: 993,
      security: 'SSL',
      username: 'campaigns@novotionservices.com',
      password: '••••••••••••••••',
      enabled: false,
    },
  },
];

const STEPS = [
  { id: 1, label: '1. Mailbox Auth' },
  { id: 2, label: '2. Audience Data' },
  { id: 3, label: '3. Dynamic Studio' },
  { id: 4, label: '4. Campaign Launch' },
];

export const NovotionEmailOnboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [provider, setProvider] = useState<ProviderType>('google');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('1');

  // Form parameters
  const [smtp, setSmtp] = useState<SmtpCredentials>(DEFAULT_PROFILES[0].smtp);
  const [imap, setImap] = useState<ImapCredentials>(DEFAULT_PROFILES[0].imap);
  const [protocolTab, setProtocolTab] = useState<'outgoing' | 'incoming'>('outgoing');
  const [showPassword, setShowPassword] = useState(false);

  // Auto-Detect States
  const [autoEmail, setAutoEmail] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectNotice, setDetectNotice] = useState<string | null>(null);

  // Handshake Diagnostics
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(true);
  const [latencyMs, setLatencyMs] = useState<number>(34);
  const [terminalDrawer, setTerminalDrawer] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    '[200 OK] DNS MX lookup verified: smtp.gmail.com',
    '[TCP SYN] Handshake latency: 34ms',
    '[TLS 1.3] Cipher: ECDHE-RSA-AES256-GCM-SHA384',
    '[AUTH 235] Authentication confirmed for outreach@novotionservices.com',
  ]);

  // Provider selection handler
  const handleSelectProvider = (prov: ProviderType) => {
    setProvider(prov);
    setSelectedProfileId('');

    if (prov === 'google') {
      setSmtp((prev) => ({ ...prev, host: 'smtp.gmail.com', port: 587, security: 'TLS' }));
      setImap((prev) => ({ ...prev, host: 'imap.gmail.com', port: 993, security: 'SSL' }));
    } else if (prov === 'microsoft') {
      setSmtp((prev) => ({ ...prev, host: 'smtp.office365.com', port: 587, security: 'STARTTLS' }));
      setImap((prev) => ({ ...prev, host: 'outlook.office365.com', port: 993, security: 'SSL' }));
    } else if (prov === 'ses') {
      setSmtp((prev) => ({ ...prev, host: 'email-smtp.us-east-1.amazonaws.com', port: 587, security: 'TLS' }));
    } else {
      setSmtp((prev) => ({ ...prev, host: '', port: 587, security: 'TLS' }));
    }
  };

  // Profile switch handler
  const handleSelectProfile = (id: string) => {
    setSelectedProfileId(id);
    const p = DEFAULT_PROFILES.find((item) => item.id === id);
    if (p) {
      setProvider(p.provider);
      setSmtp(p.smtp);
      setImap(p.imap);
      setTestSuccess(true);
      setLatencyMs(38);
    }
  };

  // Auto-Detect MX records
  const handleAutoDetect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!autoEmail.trim()) return;
    setIsDetecting(true);
    setDetectNotice(null);

    setTimeout(() => {
      const email = autoEmail.trim().toLowerCase();
      const domain = email.includes('@') ? email.split('@')[1] : email;

      if (domain.includes('gmail') || domain.includes('google')) {
        handleSelectProvider('google');
      } else if (domain.includes('outlook') || domain.includes('office') || domain.includes('microsoft')) {
        handleSelectProvider('microsoft');
      } else {
        setProvider('custom');
        setSmtp((prev) => ({ ...prev, host: `mail.${domain}`, port: 587, security: 'TLS' }));
      }

      if (email.includes('@')) {
        setSmtp((prev) => ({ ...prev, username: email }));
      }

      setIsDetecting(false);
      setDetectNotice(`Auto-detected MX configuration for "${domain}".`);
      setTimeout(() => setDetectNotice(null), 3500);
    }, 550);
  };

  // Test Handshake & Ping
  const handleTestHandshake = () => {
    setIsTesting(true);
    setTerminalDrawer(true);
    setLogs([`[INIT] Socket probe to ${smtp.host || 'smtp.gmail.com'}:${smtp.port}...`]);

    setTimeout(() => {
      setLogs((prev) => [...prev, `[DNS] A/AAAA address resolved for ${smtp.host}`]);
    }, 200);

    setTimeout(() => {
      setLogs((prev) => [...prev, `[TCP] Connected on port ${smtp.port} (SYN-ACK: 28ms)`]);
    }, 500);

    setTimeout(() => {
      setLogs((prev) => [...prev, `[TLS 1.3] Cipher negotiated: AES256-GCM-SHA384`]);
    }, 800);

    setTimeout(() => {
      if (!smtp.username || !smtp.password) {
        setLogs((prev) => [...prev, `[AUTH 535] Authentication credentials required`]);
        setTestSuccess(false);
        setIsTesting(false);
      } else {
        setLogs((prev) => [
          ...prev,
          `[AUTH 235] Authentication passed for ${smtp.username}`,
          `[READY] Relay engine validated (34ms ping)`,
        ]);
        setTestSuccess(true);
        setLatencyMs(34);
        setIsTesting(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full bg-[#09090B] text-zinc-100 font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden">
      {/* 1. TOP BAR & WORKSPACE HEADER */}
      <header className="sticky top-0 z-50 h-14 w-full backdrop-blur-md bg-[#09090B]/90 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Left: Brand Icon + Title + Pill Badge */}
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs">
              <Layers className="h-4 w-4 stroke-[2.2]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-white">Novotion</span>
              <span className="text-xs font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full border border-zinc-700/50">
                Engine v2
              </span>
            </div>
          </div>

          {/* Center: System Status Indicator */}
          <div className="hidden sm:flex items-center">
            <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-3 py-1 rounded-full flex items-center gap-2 font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>
                System Online <span className="text-zinc-500">·</span> {latencyMs}ms latency
              </span>
            </div>
          </div>

          {/* Right: Account Avatar & Quick Settings */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => alert('Quick Settings: Relay routing, SPF/DKIM verification, webhook endpoints.')}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>

            <div className="h-4 w-[1px] bg-zinc-800" />

            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-indigo-400">
                NV
              </div>
              <span className="text-xs font-medium text-zinc-300 hidden md:inline">Novotion Core</span>
            </div>
          </div>
        </div>
      </header>

      {/* STEPPER NAVIGATION TIMELINE BAR */}
      <div className="border-b border-zinc-800/80 bg-[#09090B]">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <nav aria-label="Engine Setup Steps">
            <ol className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
              {STEPS.map((step, idx) => {
                const isCurrent = currentStep === step.id;
                const isComplete = currentStep > step.id;

                return (
                  <li key={step.id} className="flex-1 min-w-[130px] flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(step.id)}
                      className="flex items-center gap-2 text-left group"
                    >
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-mono font-semibold transition-all ${
                          isComplete
                            ? 'bg-emerald-500 text-black font-bold'
                            : isCurrent
                            ? 'bg-[#6366F1] text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]'
                            : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700'
                        }`}
                      >
                        {isComplete ? <Check className="h-3 w-3 stroke-[2.5]" /> : step.id}
                      </div>

                      <span
                        className={`text-xs tracking-tight transition-colors ${
                          isCurrent
                            ? 'text-white font-semibold'
                            : isComplete
                            ? 'text-zinc-300'
                            : 'text-zinc-500'
                        }`}
                      >
                        {step.label}
                      </span>
                    </button>

                    {idx < STEPS.length - 1 && (
                      <div
                        className={`hidden md:block h-[1px] flex-1 ${
                          currentStep > step.id ? 'bg-[#6366F1]' : 'bg-zinc-800'
                        }`}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </div>

      {/* 2. WORKSPACE CORE: TWO-COLUMN BENTO GRID */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {currentStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* COLUMN A: LEFT SIDEBAR (4 Columns / lg:col-span-4) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Card 1: Provider Selection */}
              <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Select Provider
                </h3>

                <div className="space-y-2">
                  {/* Google Workspace */}
                  <button
                    type="button"
                    onClick={() => handleSelectProvider('google')}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                      provider === 'google'
                        ? 'border-indigo-500 bg-indigo-500/[0.08] shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/30'
                        : 'border-zinc-800 bg-[#121215] hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.28-2.1 3.66-5.2 3.66-9.12z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.33 24 12 24z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.24C.45 8.15 0 9.97 0 12s.45 3.85 1.24 5.42l4.04-3.13z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Google Workspace</p>
                        <p className="text-[11px] text-zinc-400">smtp.gmail.com:587</p>
                      </div>
                    </div>
                    {provider === 'google' && (
                      <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366F1]"></span>
                    )}
                  </button>

                  {/* Microsoft 365 */}
                  <button
                    type="button"
                    onClick={() => handleSelectProvider('microsoft')}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                      provider === 'microsoft'
                        ? 'border-indigo-500 bg-indigo-500/[0.08] shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/30'
                        : 'border-zinc-800 bg-[#121215] hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                        <svg className="h-3 w-3" viewBox="0 0 24 24">
                          <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                          <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
                          <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
                          <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Microsoft 365</p>
                        <p className="text-[11px] text-zinc-400">smtp.office365.com:587</p>
                      </div>
                    </div>
                    {provider === 'microsoft' && (
                      <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366F1]"></span>
                    )}
                  </button>

                  {/* Amazon SES */}
                  <button
                    type="button"
                    onClick={() => handleSelectProvider('ses')}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                      provider === 'ses'
                        ? 'border-indigo-500 bg-indigo-500/[0.08] shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/30'
                        : 'border-zinc-800 bg-[#121215] hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center flex-shrink-0">
                        <Cloud className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Amazon SES</p>
                        <p className="text-[11px] text-zinc-400">High-volume outbound relay</p>
                      </div>
                    </div>
                    {provider === 'ses' && (
                      <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366F1]"></span>
                    )}
                  </button>

                  {/* Custom SMTP */}
                  <button
                    type="button"
                    onClick={() => handleSelectProvider('custom')}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                      provider === 'custom'
                        ? 'border-indigo-500 bg-indigo-500/[0.08] shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/30'
                        : 'border-zinc-800 bg-[#121215] hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center flex-shrink-0">
                        <Server className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Custom SMTP</p>
                        <p className="text-[11px] text-zinc-400">Private VPS or relay server</p>
                      </div>
                    </div>
                    {provider === 'custom' && (
                      <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366F1]"></span>
                    )}
                  </button>
                </div>
              </div>

              {/* Card 2: Saved Profiles Dropdown */}
              <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-5 shadow-sm space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Saved Profiles
                </label>
                <select
                  value={selectedProfileId}
                  onChange={(e) => handleSelectProfile(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                >
                  <option value="" className="bg-[#121215] text-zinc-400">
                    Switch authenticated session...
                  </option>
                  {DEFAULT_PROFILES.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#121215] text-white">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Card 3: Security & App Password Callout */}
              <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-5 shadow-sm space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
                  <ShieldAlert className="h-4 w-4" />
                  <span>2-Step Verification Notice</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Google and Microsoft require an isolated 16-character <strong>App Password</strong>{' '}
                  when multi-factor authentication is active on the account.
                </p>
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium pt-1"
                >
                  <span>Google App Passwords Setup</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* COLUMN B: MAIN CREDENTIAL PANEL (8 Columns / lg:col-span-8) */}
            <div className="lg:col-span-8 rounded-2xl border border-zinc-800 bg-[#121215] shadow-2xl p-6 sm:p-8 space-y-6">
              {/* SECTION 1: Smart Auto-Discovery */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Smart Auto-Discovery
                  </label>
                  <span className="text-[11px] text-zinc-500">Auto-queries MX & PTR records</span>
                </div>

                <form onSubmit={handleAutoDetect} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={autoEmail}
                      onChange={(e) => setAutoEmail(e.target.value)}
                      placeholder="enter email: e.g. alex@company.com"
                      className="w-full h-10 px-3.5 text-sm rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-100 placeholder-zinc-500 font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isDetecting || !autoEmail.trim()}
                    className="h-10 px-4 rounded-lg text-xs font-semibold text-zinc-200 bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/60 disabled:opacity-50 transition-colors flex items-center gap-2 flex-shrink-0"
                  >
                    {isDetecting ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Querying DNS...</span>
                      </>
                    ) : (
                      <>
                        <Search className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Auto-Detect MX</span>
                      </>
                    )}
                  </button>
                </form>

                {detectNotice && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1.5 pt-0.5 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{detectNotice}</span>
                  </p>
                )}
              </div>

              {/* SECTION 2: Protocol & Relay Settings */}
              <div className="space-y-4 pt-4 border-t border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Protocol & Relay Settings
                  </span>

                  {/* Segmented Tab Switcher */}
                  <div className="inline-flex p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setProtocolTab('outgoing')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                        protocolTab === 'outgoing'
                          ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Send className="h-3 w-3" />
                      <span>SMTP (Outgoing)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProtocolTab('incoming')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                        protocolTab === 'incoming'
                          ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Inbox className="h-3 w-3" />
                      <span>IMAP (Incoming)</span>
                    </button>
                  </div>
                </div>

                {/* Outgoing SMTP Host & Port */}
                {protocolTab === 'outgoing' && (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-8 space-y-1.5">
                      <label className="block text-xs font-medium text-zinc-300">
                        Hostname <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={smtp.host}
                        onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                        placeholder="smtp.gmail.com"
                        className="w-full h-10 px-3.5 text-sm rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-100 font-mono placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>

                    <div className="sm:col-span-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-medium text-zinc-300">Port</label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSmtp({ ...smtp, port: 587, security: 'TLS' })}
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                              smtp.port === 587
                                ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/40'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            587 TLS
                          </button>
                          <button
                            type="button"
                            onClick={() => setSmtp({ ...smtp, port: 465, security: 'SSL' })}
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                              smtp.port === 465
                                ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/40'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            465 SSL
                          </button>
                        </div>
                      </div>
                      <input
                        type="number"
                        value={smtp.port}
                        onChange={(e) => setSmtp({ ...smtp, port: parseInt(e.target.value) || 0 })}
                        className="w-full h-10 px-3.5 text-sm rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-100 font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Incoming IMAP Host & Port */}
                {protocolTab === 'incoming' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/40">
                      <div>
                        <p className="text-xs font-semibold text-white">Inbound Reply & Bounce Tracking</p>
                        <p className="text-[11px] text-zinc-400">
                          Detect prospective replies, out-of-office autoreplies, and failed deliveries.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={imap.enabled}
                        onChange={(e) => setImap({ ...imap, enabled: e.target.checked })}
                        className="h-4 w-4 rounded text-indigo-600 bg-zinc-900 border-zinc-700"
                      />
                    </div>

                    {imap.enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-1">
                        <div className="sm:col-span-8 space-y-1.5">
                          <label className="block text-xs font-medium text-zinc-300">IMAP Host</label>
                          <input
                            type="text"
                            value={imap.host}
                            onChange={(e) => setImap({ ...imap, host: e.target.value })}
                            placeholder="imap.gmail.com"
                            className="w-full h-10 px-3.5 text-sm rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-100 font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                          />
                        </div>
                        <div className="sm:col-span-4 space-y-1.5">
                          <label className="block text-xs font-medium text-zinc-300">Port (993 SSL)</label>
                          <input
                            type="number"
                            value={imap.port}
                            onChange={(e) => setImap({ ...imap, port: parseInt(e.target.value) || 0 })}
                            className="w-full h-10 px-3.5 text-sm rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-100 font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION 3: Sender Credentials */}
              <div className="space-y-4 pt-4 border-t border-zinc-800/80">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Sender Credentials
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Username/Email */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">
                      Username / Email <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={smtp.username}
                        onChange={(e) => setSmtp({ ...smtp, username: e.target.value })}
                        placeholder="outreach@novotionservices.com"
                        autoComplete="off"
                        className="w-full h-10 pl-9 pr-3.5 text-sm rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-100 font-mono placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                      <Mail className="h-4 w-4 text-zinc-500 absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  {/* Password with Eye toggle */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-zinc-300">
                        Password / App Password <span className="text-rose-400">*</span>
                      </label>
                      <span className="text-[10px] text-zinc-500 font-mono">16-char token</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={smtp.password}
                        onChange={(e) => setSmtp({ ...smtp, password: e.target.value })}
                        placeholder="••••••••••••••••"
                        autoComplete="new-password"
                        className="w-full h-10 pl-9 pr-10 text-sm rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-100 font-mono placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                      <Lock className="h-4 w-4 text-zinc-500 absolute left-3 top-3 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-200"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Sender Display Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">
                      Sender Display Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={smtp.senderName}
                        onChange={(e) => setSmtp({ ...smtp, senderName: e.target.value })}
                        placeholder="Alex Morgan | Novotion"
                        className="w-full h-10 pl-9 pr-3.5 text-sm rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                      <User className="h-4 w-4 text-zinc-500 absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  {/* Reply-to Address */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">
                      Reply-To Address (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={smtp.replyTo}
                        onChange={(e) => setSmtp({ ...smtp, replyTo: e.target.value })}
                        placeholder="replies@novotionservices.com"
                        className="w-full h-10 pl-9 pr-3.5 text-sm rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-100 font-mono placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                      <Mail className="h-4 w-4 text-zinc-500 absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Handshake Telemetry & Socket Drawer */}
              {terminalDrawer && (
                <div className="pt-2 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2">
                      {testSuccess ? (
                        <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Socket Handshake Authenticated ({latencyMs}ms)</span>
                        </span>
                      ) : (
                        <span className="text-rose-400 font-medium">Authentication Failed. Review token.</span>
                      )}
                    </div>
                    <span className="text-zinc-500 font-mono text-[11px]">TLS 1.3 / ECDHE</span>
                  </div>

                  <div className="mt-2 p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-300 space-y-1 max-h-32 overflow-y-auto">
                    {logs.map((log, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="text-zinc-600">›</span>
                        <span
                          className={
                            log.includes('passed') || log.includes('verified')
                              ? 'text-emerald-400'
                              : log.includes('ERROR') || log.includes('required')
                              ? 'text-rose-400'
                              : 'text-zinc-300'
                          }
                        >
                          {log}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 4: Card Action Footer */}
              <div className="pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleTestHandshake}
                  disabled={isTesting}
                  className="h-10 px-4 rounded-lg text-xs font-semibold text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Probing Handshake...' : 'Test Handshake & Ping'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-lg text-xs transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2"
                >
                  <span>Next: Audience & Contacts</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Audience Data */}
        {currentStep === 2 && (
          <div className="rounded-2xl border border-zinc-800 bg-[#121215] shadow-2xl p-8 text-center max-w-2xl mx-auto space-y-6">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Audience & Contact Data</h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                Upload CSV prospect lists or pull directly from your Novotion Sales Lead database.
              </p>
            </div>

            <div className="border-2 border-dashed border-zinc-800 rounded-xl p-8 hover:border-indigo-500/50 transition-colors cursor-pointer bg-zinc-900/30">
              <p className="text-xs font-semibold text-zinc-300">Drop CSV file here or click to browse</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Auto-matches: Email, First Name, Company, Job Title, LinkedIn
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                ← Back to Mailbox Auth
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2 rounded-lg text-xs shadow-sm transition-all"
              >
                Next: Dynamic Studio →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Dynamic Studio */}
        {currentStep === 3 && (
          <div className="rounded-2xl border border-zinc-800 bg-[#121215] shadow-2xl p-8 text-center max-w-2xl mx-auto space-y-6">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
              <Terminal className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Dynamic AI Template Studio</h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                Generate high-converting personalized cold email variations using Claude 3.5 Sonnet & GPT-4o.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                ← Back to Audience Data
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2 rounded-lg text-xs shadow-sm transition-all"
              >
                Next: Campaign Launch →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Campaign Launch */}
        {currentStep === 4 && (
          <div className="rounded-2xl border border-zinc-800 bg-[#121215] shadow-2xl p-8 text-center max-w-2xl mx-auto space-y-6">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Engine Pre-Flight Checklist Complete</h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                Mailbox authenticated as <span className="text-indigo-400 font-mono">{smtp.username}</span>. Rate limit: 25 emails/hour.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                ← Back to Dynamic Studio
              </button>
              <button
                type="button"
                onClick={() => alert('Campaign engine launched successfully via authenticated SMTP gateway!')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-6 py-2.5 rounded-lg text-xs shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all"
              >
                Launch Outbound Sequence 🚀
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
