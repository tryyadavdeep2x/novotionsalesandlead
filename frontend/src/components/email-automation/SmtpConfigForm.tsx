import React, { useState } from 'react';
import {
  Send,
  Inbox,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Shield,
  BookmarkPlus,
  Check,
} from 'lucide-react';
import { SmtpConfig, ImapConfig, SecurityProtocol } from './types.js';

interface SmtpConfigFormProps {
  smtp: SmtpConfig;
  imap: ImapConfig;
  onChangeSmtp: (field: keyof SmtpConfig, value: any) => void;
  onChangeImap: (field: keyof ImapConfig, value: any) => void;
  onSaveSession: (profileName: string) => void;
}

export const SmtpConfigForm: React.FC<SmtpConfigFormProps> = ({
  smtp,
  imap,
  onChangeSmtp,
  onChangeImap,
  onSaveSession,
}) => {
  const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming'>('outgoing');
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [showImapPassword, setShowImapPassword] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Quick port selection helpers
  const applySmtpPort = (port: number, security: SecurityProtocol) => {
    onChangeSmtp('port', port);
    onChangeSmtp('security', security);
  };

  const applyImapPort = (port: number, security: SecurityProtocol) => {
    onChangeImap('port', port);
    onChangeImap('security', security);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;
    onSaveSession(profileName.trim());
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setProfileName('');
    }, 2500);
  };

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#18181b] shadow-xs overflow-hidden transition-colors">
      {/* Top Segmented Tabs: Outgoing (SMTP) vs Incoming (IMAP/POP3) */}
      <div className="border-b border-slate-200/80 dark:border-white/10 px-6 pt-5 pb-4 bg-slate-50/50 dark:bg-zinc-900/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              Gateway Configuration
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Specify host addresses, encryption protocol, and authentication credentials.
            </p>
          </div>

          {/* Segmented Pill Tabs */}
          <div className="inline-flex p-1 rounded-lg bg-slate-200/70 dark:bg-zinc-800 text-xs font-medium self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('outgoing')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'outgoing'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              <span>Outgoing (SMTP)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('incoming')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'incoming'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Inbox className="h-3.5 w-3.5" />
              <span>Incoming (IMAP/POP)</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* TAB 1: Outgoing (SMTP) */}
        {activeTab === 'outgoing' && (
          <div className="space-y-5 animate-in fade-in-50 duration-200">
            {/* Host & Port Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8">
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                  SMTP Host Server <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={smtp.host}
                    onChange={(e) => onChangeSmtp('host', e.target.value)}
                    placeholder="e.g. smtp.gmail.com or mail.novotion.com"
                    className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="md:col-span-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                    Port & Protocol <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">Preset tags</span>
                </div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <button
                    type="button"
                    onClick={() => applySmtpPort(587, 'TLS')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                      smtp.port === 587
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    TLS 587
                  </button>
                  <button
                    type="button"
                    onClick={() => applySmtpPort(465, 'SSL')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                      smtp.port === 465
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    SSL 465
                  </button>
                  <button
                    type="button"
                    onClick={() => applySmtpPort(25, 'STARTTLS')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                      smtp.port === 25
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    25
                  </button>
                </div>
                <input
                  type="number"
                  value={smtp.port}
                  onChange={(e) => onChangeSmtp('port', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Username & Password Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                  SMTP Username / Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={smtp.username}
                    onChange={(e) => onChangeSmtp('username', e.target.value)}
                    placeholder="outreach@novotionservices.com"
                    autoComplete="off"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all font-mono"
                  />
                  <Mail className="h-4 w-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                    SMTP Password / App Password <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                    <Shield className="h-3 w-3 text-emerald-500" />
                    Encrypted in-flight
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showSmtpPassword ? 'text' : 'password'}
                    value={smtp.password}
                    onChange={(e) => onChangeSmtp('password', e.target.value)}
                    placeholder="••••••••••••••••"
                    autoComplete="new-password"
                    className="w-full pl-9 pr-10 py-2.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all font-mono"
                  />
                  <Lock className="h-4 w-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                  >
                    {showSmtpPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Sender Identity & Reply-To */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                  Sender Display Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={smtp.senderName}
                    onChange={(e) => onChangeSmtp('senderName', e.target.value)}
                    placeholder="e.g. Alex Morgan | Novotion Services"
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all"
                  />
                  <User className="h-4 w-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-2.5 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                  Recipient will see this friendly name in their email client.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                  Custom Reply-To Header (Optional)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={smtp.replyTo}
                    onChange={(e) => onChangeSmtp('replyTo', e.target.value)}
                    placeholder="replies@novotionservices.com"
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all font-mono"
                  />
                  <Mail className="h-4 w-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-2.5 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                  Leave blank to default to your authenticated SMTP address.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Incoming (IMAP/POP3) */}
        {activeTab === 'incoming' && (
          <div className="space-y-5 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <Inbox className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    Synchronize Inbound Replies & Bounce Tracking
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Allows AI to detect out-of-office messages, prospect responses, and invalid emails.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={imap.enabled}
                  onChange={(e) => onChangeImap('enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {imap.enabled && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-8">
                    <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                      IMAP Host Server
                    </label>
                    <input
                      type="text"
                      value={imap.host}
                      onChange={(e) => onChangeImap('host', e.target.value)}
                      placeholder="e.g. imap.gmail.com or outlook.office365.com"
                      className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                        IMAP Port
                      </label>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => applyImapPort(993, 'SSL')}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
                        >
                          993 SSL
                        </button>
                        <button
                          type="button"
                          onClick={() => applyImapPort(143, 'STARTTLS')}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
                        >
                          143
                        </button>
                      </div>
                    </div>
                    <input
                      type="number"
                      value={imap.port}
                      onChange={(e) => onChangeImap('port', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                      IMAP Username
                    </label>
                    <input
                      type="text"
                      value={imap.username}
                      onChange={(e) => onChangeImap('username', e.target.value)}
                      placeholder="outreach@novotionservices.com"
                      className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                      IMAP Password
                    </label>
                    <div className="relative">
                      <input
                        type={showImapPassword ? 'text' : 'password'}
                        value={imap.password}
                        onChange={(e) => onChangeImap('password', e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full px-3.5 pr-10 py-2.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowImapPassword(!showImapPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                      >
                        {showImapPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Save Mailbox Profile Section */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form onSubmit={handleSaveProfile} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Give this profile a name (e.g. Sales Team US)..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-700/80 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
              />
              <BookmarkPlus className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 absolute left-2.5 top-2.5" />
            </div>
            <button
              type="submit"
              disabled={!profileName.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {saveSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Saved!</span>
                </>
              ) : (
                <span>Save Profile</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
