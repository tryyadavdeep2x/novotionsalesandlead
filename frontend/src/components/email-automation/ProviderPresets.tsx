import React, { useState } from 'react';
import { Server, Search, CheckCircle2, Bookmark, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import { SmtpProviderType, SavedSmtpSession } from './types.js';

interface ProviderPresetsProps {
  activeProvider: SmtpProviderType;
  onSelectProvider: (provider: SmtpProviderType) => void;
  onAutoDetect: (domain: string) => void;
  savedSessions: SavedSmtpSession[];
  onLoadSession: (session: SavedSmtpSession) => void;
  onDeleteSession?: (id: string) => void;
}

export const ProviderPresets: React.FC<ProviderPresetsProps> = ({
  activeProvider,
  onSelectProvider,
  onAutoDetect,
  savedSessions,
  onLoadSession,
  onDeleteSession,
}) => {
  const [detectInput, setDetectInput] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectSuccess, setDetectSuccess] = useState<string | null>(null);

  const handleDetectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detectInput.trim()) return;
    setIsDetecting(true);
    setDetectSuccess(null);

    setTimeout(() => {
      const input = detectInput.trim().toLowerCase();
      const domain = input.includes('@') ? input.split('@')[1] : input;
      onAutoDetect(domain);
      setIsDetecting(false);
      setDetectSuccess(`Resolved MX records for "${domain}"`);
      setTimeout(() => setDetectSuccess(null), 4000);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* 1. Mailbox Provider Selection */}
      <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#18181b] p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Mailbox Provider
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Select your service to auto-fill default gateway endpoints.
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {/* Google Workspace */}
          <button
            type="button"
            onClick={() => onSelectProvider('google')}
            className={`w-full text-left flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-200 ${
              activeProvider === 'google'
                ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 ring-1 ring-indigo-600/30'
                : 'border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/50'
            }`}
          >
            {/* Google G SVG */}
            <div className="h-7 w-7 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200/70 dark:border-zinc-700 p-1 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <svg className="h-4 w-4" viewBox="0 0 24 24">
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
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Google Workspace
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                  TLS / 587
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                smtp.gmail.com with App Password
              </p>
            </div>
          </button>

          {/* Microsoft 365 */}
          <button
            type="button"
            onClick={() => onSelectProvider('microsoft')}
            className={`w-full text-left flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-200 ${
              activeProvider === 'microsoft'
                ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 ring-1 ring-indigo-600/30'
                : 'border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/50'
            }`}
          >
            {/* Microsoft 4-square SVG */}
            <div className="h-7 w-7 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200/70 dark:border-zinc-700 p-1 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
                <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
                <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Microsoft 365
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                  STARTTLS / 587
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                smtp.office365.com exchange relay
              </p>
            </div>
          </button>

          {/* Custom SMTP / IMAP */}
          <button
            type="button"
            onClick={() => onSelectProvider('custom')}
            className={`w-full text-left flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-200 ${
              activeProvider === 'custom'
                ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 ring-1 ring-indigo-600/30'
                : 'border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/50'
            }`}
          >
            <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/40 p-1 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400 shadow-2xs">
              <Server className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Custom Gateway
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                  Any Port
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                SendGrid, AWS SES, Postmark, Private VPS
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Auto-Detect DNS/MX Settings */}
      <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#18181b] p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-2.5">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
            Auto-Detect DNS/MX
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3.5">
          Enter your company domain or email to automatically discover mail server configurations.
        </p>

        <form onSubmit={handleDetectSubmit} className="space-y-2.5">
          <div className="relative">
            <input
              type="text"
              value={detectInput}
              onChange={(e) => setDetectInput(e.target.value)}
              placeholder="e.g. novotionservices.com"
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-700/80 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all font-mono"
            />
            <Search className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 absolute left-2.5 top-2.5" />
          </div>

          <button
            type="submit"
            disabled={isDetecting || !detectInput.trim()}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-slate-700 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200/80 dark:hover:bg-zinc-700/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
          >
            {isDetecting ? (
              <>
                <div className="h-3 w-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>Querying MX Records...</span>
              </>
            ) : (
              <>
                <span>Resolve Mail Exchanger</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        {detectSuccess && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{detectSuccess}</span>
          </div>
        )}
      </div>

      {/* 3. Saved Mailbox Profiles */}
      <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#18181b] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-slate-500 dark:text-zinc-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Saved Mailboxes
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500">
            {savedSessions.length} profiles
          </span>
        </div>

        {savedSessions.length === 0 ? (
          <div className="py-6 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-lg">
            <p className="text-xs text-slate-400 dark:text-zinc-500">No saved mailboxes yet.</p>
            <p className="text-[11px] text-slate-400 dark:text-zinc-600 mt-0.5">
              Profiles you save will appear here for 1-click restore.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {savedSessions.map((session) => (
              <div
                key={session.id}
                className="group flex items-center justify-between p-2.5 rounded-lg border border-slate-200/70 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-zinc-900/50 transition-all"
              >
                <button
                  type="button"
                  onClick={() => onLoadSession(session)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {session.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono truncate">
                    {session.smtp.username || session.smtp.host}
                  </p>
                </button>

                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                    :{session.smtp.port}
                  </span>
                  {onDeleteSession && (
                    <button
                      type="button"
                      onClick={() => onDeleteSession(session.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 transition-opacity"
                      title="Delete profile"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
