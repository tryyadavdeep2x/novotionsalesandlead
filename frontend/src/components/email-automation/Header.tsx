import React from 'react';
import { Mail, Sparkles, Moon, Sun } from 'lucide-react';
import { SmtpProviderType } from './types.js';

interface HeaderProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  smtpConnected: boolean;
  smtpUsername?: string;
  activeProvider: SmtpProviderType;
  onSelectPreset: (provider: SmtpProviderType) => void;
  onOpenAiCopilot: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleTheme,
  smtpConnected,
  smtpUsername,
  activeProvider,
  onSelectPreset,
  onOpenAiCopilot,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 p-0.5 shadow-sm shadow-indigo-500/25 flex items-center justify-center text-white">
            <Mail className="h-4 w-4 stroke-[2]" />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-bold tracking-tight text-slate-900 dark:text-white text-base">
              Novotion <span className="font-medium text-slate-600 dark:text-slate-400">Email</span>
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-1 ring-inset ring-indigo-600/20">
              AUTOMATION v2.0
            </span>
          </div>
        </div>

        {/* Center: System Health & Connection Pulse */}
        <div className="hidden md:flex items-center">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 text-xs shadow-xs">
            {smtpConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-medium text-slate-700 dark:text-zinc-300">
                  SMTP Live: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{smtpUsername || 'Connected'}</span>
                </span>
              </>
            ) : (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-slate-600 dark:text-zinc-400 font-medium">
                  SMTP: <span className="text-amber-600 dark:text-amber-400">Awaiting Authentication</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: Quick Actions, AI Copilot, Theme */}
        <div className="flex items-center gap-2.5">
          {/* Quick Preset Picker */}
          <div className="hidden lg:flex items-center bg-slate-100 dark:bg-zinc-900/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-zinc-800 text-xs font-medium">
            <button
              onClick={() => onSelectPreset('google')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeProvider === 'google'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Google
            </button>
            <button
              onClick={() => onSelectPreset('microsoft')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeProvider === 'microsoft'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              M365
            </button>
            <button
              onClick={() => onSelectPreset('custom')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeProvider === 'custom'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Custom
            </button>
          </div>

          {/* AI Copilot Button with Shimmer */}
          <button
            onClick={onOpenAiCopilot}
            className="group relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-sm shadow-indigo-500/20 active:scale-95 transition-all overflow-hidden"
          >
            <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />
            <Sparkles className="h-3.5 w-3.5 text-indigo-200 animate-pulse" />
            <span>AI Copilot</span>
            <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.2 rounded bg-black/20 text-[10px] font-mono text-indigo-100">
              ⌘K
            </kbd>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 border border-transparent hover:border-slate-200 dark:hover:border-zinc-700/60 transition-all active:scale-95"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
