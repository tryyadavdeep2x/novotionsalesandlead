import React, { useState } from 'react';
import {
  Send,
  Inbox,
  Eye,
  EyeOff,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  BookmarkPlus,
  Check,
} from 'lucide-react';
import { SmtpConfig, ImapConfig, SecurityProtocol, ConnectionLog } from './types.js';

interface SmtpConfigCardProps {
  smtp: SmtpConfig;
  imap: ImapConfig;
  onChangeSmtp: (field: keyof SmtpConfig, value: any) => void;
  onChangeImap: (field: keyof ImapConfig, value: any) => void;
  onAutoDetect: (query: string) => void;
  isTesting: boolean;
  isConnected: boolean;
  latencyMs?: number;
  logs: ConnectionLog[];
  onTestConnection: () => void;
  onContinue: () => void;
  onSaveProfile: (name: string) => void;
}

export const SmtpConfigCard: React.FC<SmtpConfigCardProps> = ({
  smtp,
  imap,
  onChangeSmtp,
  onChangeImap,
  onAutoDetect,
  isTesting,
  isConnected,
  latencyMs,
  logs,
  onTestConnection,
  onContinue,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming'>('outgoing');
  const [autoDetectEmail, setAutoDetectEmail] = useState('');
  const [detectLoading, setDetectLoading] = useState(false);
  const [detectSuccess, setDetectSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [showLogDrawer, setShowLogDrawer] = useState(false);

  const handleRunAutoDetect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!autoDetectEmail.trim()) return;
    setDetectLoading(true);
    setDetectSuccess(null);

    setTimeout(() => {
      onAutoDetect(autoDetectEmail.trim());
      setDetectLoading(false);
      setDetectSuccess(`Discovered MX configuration for ${autoDetectEmail.trim()}`);
      setTimeout(() => setDetectSuccess(null), 3500);
    }, 500);
  };

  const handleSaveCurrentProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileNameInput.trim()) return;
    onSaveProfile(profileNameInput.trim());
    setProfileSaved(true);
    setTimeout(() => {
      setProfileSaved(false);
      setProfileNameInput('');
    }, 2000);
  };

  const applyPort = (port: number, sec: SecurityProtocol) => {
    onChangeSmtp('port', port);
    onChangeSmtp('security', sec);
  };

  const applyImapPort = (port: number, sec: SecurityProtocol) => {
    onChangeImap('port', port);
    onChangeImap('security', sec);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6 transition-colors">
      {/* SECTION 1: Auto-detection box */}
      <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 p-4">
        <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
          Auto-Detect Server Parameters
        </label>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
          Enter your company email address to query DNS MX records and configure ports automatically.
        </p>

        <form onSubmit={handleRunAutoDetect} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={autoDetectEmail}
              onChange={(e) => setAutoDetectEmail(e.target.value)}
              placeholder="e.g. alex@novotionservices.com"
              className="w-full h-10 pl-3.5 pr-8 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
            />
            <Search className="h-4 w-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
          </div>
          <button
            type="submit"
            disabled={detectLoading || !autoDetectEmail.trim()}
            className="h-10 px-4 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 flex-shrink-0"
          >
            {detectLoading ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>Querying MX...</span>
              </>
            ) : (
              <span>Auto Detect</span>
            )}
          </button>
        </form>

        {detectSuccess && (
          <div className="mt-2.5 flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{detectSuccess}</span>
          </div>
        )}
      </div>

      {/* SECTION 2: Server Parameters Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Server Protocol
          </span>

          <div className="inline-flex p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('outgoing')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                activeTab === 'outgoing'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              <span>Outgoing (SMTP)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('incoming')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                activeTab === 'incoming'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Inbox className="h-3.5 w-3.5" />
              <span>Incoming (IMAP/POP)</span>
            </button>
          </div>
        </div>

        {/* Outgoing SMTP View */}
        {activeTab === 'outgoing' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8 space-y-1.5">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                SMTP Host Server <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={smtp.host}
                onChange={(e) => onChangeSmtp('host', e.target.value)}
                placeholder="e.g. smtp.gmail.com or mail.domain.com"
                className="w-full h-10 px-3.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-mono placeholder-zinc-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
              />
            </div>

            <div className="md:col-span-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Port
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => applyPort(587, 'TLS')}
                    className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded transition-colors ${
                      smtp.port === 587
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    587 TLS
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPort(465, 'SSL')}
                    className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded transition-colors ${
                      smtp.port === 465
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    465 SSL
                  </button>
                </div>
              </div>
              <input
                type="number"
                value={smtp.port}
                onChange={(e) => onChangeSmtp('port', parseInt(e.target.value) || 0)}
                className="w-full h-10 px-3.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
              />
            </div>
          </div>
        )}

        {/* Incoming IMAP View */}
        {activeTab === 'incoming' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                  Sync Inbound Replies & Detect Bounces
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Allows automated categorization of prospect responses and invalid addresses.
                </p>
              </div>
              <input
                type="checkbox"
                checked={imap.enabled}
                onChange={(e) => onChangeImap('enabled', e.target.checked)}
                className="h-4 w-4 rounded text-indigo-600 border-zinc-300 dark:border-zinc-700 focus:ring-indigo-500"
              />
            </div>

            {imap.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
                <div className="md:col-span-8 space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    IMAP Host Server
                  </label>
                  <input
                    type="text"
                    value={imap.host}
                    onChange={(e) => onChangeImap('host', e.target.value)}
                    placeholder="imap.gmail.com"
                    className="w-full h-10 px-3.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      IMAP Port
                    </label>
                    <button
                      type="button"
                      onClick={() => applyImapPort(993, 'SSL')}
                      className="text-xs font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    >
                      993 SSL
                    </button>
                  </div>
                  <input
                    type="number"
                    value={imap.port}
                    onChange={(e) => onChangeImap('port', parseInt(e.target.value) || 0)}
                    className="w-full h-10 px-3.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 3: Credentials */}
      <div className="space-y-4 pt-2 border-t border-zinc-200 dark:border-zinc-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Authentication Credentials
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Username / Account Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={smtp.username}
              onChange={(e) => onChangeSmtp('username', e.target.value)}
              placeholder="outreach@novotionservices.com"
              autoComplete="off"
              className="w-full h-10 px-3.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Password / App Password <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                Secured
              </span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={smtp.password}
                onChange={(e) => onChangeSmtp('password', e.target.value)}
                placeholder="••••••••••••••••"
                autoComplete="new-password"
                className="w-full h-10 pl-3.5 pr-10 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Sender Display Name
            </label>
            <input
              type="text"
              value={smtp.senderName}
              onChange={(e) => onChangeSmtp('senderName', e.target.value)}
              placeholder="e.g. Alex Morgan | Novotion"
              className="w-full h-10 px-3.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Custom Reply-To Header (Optional)
            </label>
            <input
              type="email"
              value={smtp.replyTo}
              onChange={(e) => onChangeSmtp('replyTo', e.target.value)}
              placeholder="replies@novotionservices.com"
              className="w-full h-10 px-3.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Diagnostics / Handshake Telemetry Bar */}
      {logs.length > 0 && (
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-xs py-1">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Handshake Authenticated</span>
                  {latencyMs !== undefined && (
                    <span className="font-mono text-zinc-500 font-normal">({latencyMs}ms)</span>
                  )}
                </span>
              ) : isTesting ? (
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Testing socket handshake...</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                  <AlertCircle className="h-4 w-4" />
                  <span>Authentication failed. Review credentials.</span>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowLogDrawer(!showLogDrawer)}
              className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-mono text-[11px] underline"
            >
              {showLogDrawer ? 'Hide Logs' : 'View Socket Logs'}
            </button>
          </div>

          {showLogDrawer && (
            <div className="mt-2 p-3 rounded-lg bg-zinc-950 text-zinc-300 font-mono text-[11px] max-h-36 overflow-y-auto space-y-1 border border-zinc-800">
              {logs.map((l) => (
                <div key={l.id} className="flex items-center gap-2">
                  <span className="text-zinc-500">{l.timestamp}</span>
                  <span
                    className={
                      l.type === 'success'
                        ? 'text-emerald-400'
                        : l.type === 'error'
                        ? 'text-rose-400'
                        : 'text-zinc-300'
                    }
                  >
                    {l.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FOOTER BAR: Test Connection (left) & Next CTA (right) */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Test Connection & Save Profile */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTestConnection}
            disabled={isTesting}
            className="h-10 px-4 rounded-lg text-xs font-semibold text-zinc-800 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 border border-zinc-300 dark:border-zinc-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Verifying...' : 'Test Connection'}</span>
          </button>

          {/* Quick inline save profile */}
          <form onSubmit={handleSaveCurrentProfile} className="flex items-center gap-1.5">
            <input
              type="text"
              value={profileNameInput}
              onChange={(e) => setProfileNameInput(e.target.value)}
              placeholder="Save profile as..."
              className="h-10 px-2.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 outline-none w-32 sm:w-36"
            />
            <button
              type="submit"
              disabled={!profileNameInput.trim()}
              className="h-10 px-2.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 disabled:opacity-30 transition-colors flex items-center gap-1"
              title="Save Profile"
            >
              {profileSaved ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
            </button>
          </form>
        </div>

        {/* Right: High-contrast primary CTA */}
        <button
          type="button"
          onClick={onContinue}
          className="h-10 px-6 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          <span>Next: Upload Contacts</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
