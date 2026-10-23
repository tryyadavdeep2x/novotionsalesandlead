import React from 'react';
import { Server, HelpCircle, ExternalLink, Bookmark, Check } from 'lucide-react';
import { SmtpProviderType, SavedSmtpSession } from './types.js';

interface ProfilePresetsPanelProps {
  activeProvider: SmtpProviderType;
  onSelectProvider: (provider: SmtpProviderType) => void;
  savedSessions: SavedSmtpSession[];
  onLoadSession: (session: SavedSmtpSession) => void;
  selectedSessionId?: string;
}

export const ProfilePresetsPanel: React.FC<ProfilePresetsPanelProps> = ({
  activeProvider,
  onSelectProvider,
  savedSessions,
  onLoadSession,
  selectedSessionId,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Step Overview & Brief Guide */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          Connect Mailbox
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
          Configure your outbound SMTP relay to send AI-personalized sequences directly from your
          company domain with SPF & DKIM reputation alignment.
        </p>
      </div>

      {/* 2. Quick-Load Saved Profiles Dropdown */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Saved Mailbox Profile
        </label>
        <div className="relative">
          <select
            value={selectedSessionId || ''}
            onChange={(e) => {
              const session = savedSessions.find((s) => s.id === e.target.value);
              if (session) onLoadSession(session);
            }}
            className="w-full h-10 px-3.5 pr-9 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all cursor-pointer"
          >
            <option value="">Choose saved profile...</option>
            {savedSessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.smtp.username || s.smtp.host})
              </option>
            ))}
          </select>
          <Bookmark className="h-4 w-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
        </div>
      </div>

      {/* 3. Preset Switches (Google Workspace, Microsoft 365, Custom) */}
      <div className="space-y-2.5 pt-2 border-t border-zinc-200/80 dark:border-zinc-800">
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Provider Templates
        </span>

        <div className="space-y-2">
          {/* Google Workspace */}
          <button
            type="button"
            onClick={() => onSelectProvider('google')}
            className={`w-full text-left flex items-center justify-between p-3 rounded-xl border transition-all ${
              activeProvider === 'google'
                ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 dark:border-indigo-500 ring-1 ring-indigo-600/20'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/60'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Google G SVG */}
              <div className="h-7 w-7 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
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
                <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                  Google Workspace
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  smtp.gmail.com:587 (TLS)
                </p>
              </div>
            </div>
            {activeProvider === 'google' && (
              <span className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                <Check className="h-3 w-3 stroke-[2.5]" />
              </span>
            )}
          </button>

          {/* Microsoft 365 */}
          <button
            type="button"
            onClick={() => onSelectProvider('microsoft')}
            className={`w-full text-left flex items-center justify-between p-3 rounded-xl border transition-all ${
              activeProvider === 'microsoft'
                ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 dark:border-indigo-500 ring-1 ring-indigo-600/20'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/60'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Microsoft 4-square SVG */}
              <div className="h-7 w-7 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                  <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                  <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
                  <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
                  <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                  Microsoft 365
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  smtp.office365.com:587
                </p>
              </div>
            </div>
            {activeProvider === 'microsoft' && (
              <span className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                <Check className="h-3 w-3 stroke-[2.5]" />
              </span>
            )}
          </button>

          {/* Custom SMTP / IMAP */}
          <button
            type="button"
            onClick={() => onSelectProvider('custom')}
            className={`w-full text-left flex items-center justify-between p-3 rounded-xl border transition-all ${
              activeProvider === 'custom'
                ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 dark:border-indigo-500 ring-1 ring-indigo-600/20'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0 text-zinc-600 dark:text-zinc-300 shadow-2xs">
                <Server className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                  Custom Gateway
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  SendGrid, AWS SES, Self-hosted
                </p>
              </div>
            </div>
            {activeProvider === 'custom' && (
              <span className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                <Check className="h-3 w-3 stroke-[2.5]" />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 4. Authentication Tip Callout (Google App Password helper) */}
      <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-4">
        <div className="flex items-start gap-2.5">
          <HelpCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              Two-Factor Authentication?
            </p>
            <p className="text-amber-800/90 dark:text-amber-300/80 leading-relaxed text-[11px]">
              If 2FA is active, standard account passwords will be blocked. Use a generated
              16-character <strong>App Password</strong>.
            </p>
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-amber-900 dark:text-amber-100 hover:underline pt-1 text-[11px]"
            >
              <span>Google App Password Portal</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
