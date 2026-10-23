import React, { useState } from 'react';
import {
  Activity,
  Terminal,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Zap,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { ConnectionLog } from './types.js';

interface ConnectionStatusProps {
  testing: boolean;
  connected: boolean;
  latencyMs?: number;
  logs: ConnectionLog[];
  onTestConnection: () => void;
  onContinue: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  testing,
  connected,
  latencyMs,
  logs,
  onTestConnection,
  onContinue,
}) => {
  const [showLogs, setShowLogs] = useState(true);
  const [showAppPasswordGuide, setShowAppPasswordGuide] = useState(true);

  return (
    <div className="space-y-6">
      {/* Diagnostics & Connection Test Card */}
      <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#18181b] p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Handshake & Health
            </h3>
          </div>

          {/* Status Indicator Pill */}
          {connected ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-600/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Authenticated
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Not Tested
            </span>
          )}
        </div>

        {/* Latency & Protocol Telemetry */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/70 dark:border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 tracking-wider">
              Latency
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-mono font-semibold text-slate-900 dark:text-white">
                {latencyMs !== undefined ? `${latencyMs}ms` : '--'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/70 dark:border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 tracking-wider">
              TLS Cipher
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs font-mono font-semibold text-slate-900 dark:text-white">
                {connected ? 'TLS 1.3 / AES' : 'Awaiting'}
              </span>
            </div>
          </div>
        </div>

        {/* Test Connection Button */}
        <button
          type="button"
          onClick={onTestConnection}
          disabled={testing}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-800 dark:text-white bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200/80 dark:hover:bg-zinc-700/80 border border-slate-200/80 dark:border-zinc-700 transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed mb-3"
        >
          {testing ? (
            <>
              <div className="h-3.5 w-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>Verifying Handshake & Auth...</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
              <span>Test Connection & Login</span>
            </>
          )}
        </button>

        {/* Diagnostic Logs Drawer Toggle */}
        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setShowLogs(!showLogs)}
            className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
          >
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <Terminal className="h-3.5 w-3.5" />
              Diagnostic Logs ({logs.length})
            </span>
            {showLogs ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {showLogs && (
            <div className="mt-2.5 p-3 rounded-lg bg-slate-950 text-slate-300 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto space-y-1 border border-slate-800 select-text shadow-inner">
              {logs.length === 0 ? (
                <div className="text-slate-500 italic">
                  Press "Test Connection" to perform pre-flight socket validation...
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-1.5">
                    <span className="text-slate-500 shrink-0 select-none">›</span>
                    <span className="text-slate-400 select-none">{log.timestamp}</span>
                    <span
                      className={
                        log.type === 'success'
                          ? 'text-emerald-400 font-medium'
                          : log.type === 'error'
                          ? 'text-rose-400 font-medium'
                          : log.type === 'warning'
                          ? 'text-amber-400'
                          : 'text-slate-300'
                      }
                    >
                      {log.message}
                    </span>
                    {log.latencyMs !== undefined && (
                      <span className="text-amber-400/80 text-[10px] ml-auto">
                        +{log.latencyMs}ms
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Informational Callout: Google & Microsoft App Password Guide */}
      <div className="rounded-xl border border-amber-200/60 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/20 p-4 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-200">
              Using Google or Microsoft 2FA?
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setShowAppPasswordGuide(!showAppPasswordGuide)}
            className="text-amber-700 dark:text-amber-300 p-0.5"
          >
            {showAppPasswordGuide ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {showAppPasswordGuide && (
          <div className="mt-2.5 text-xs text-amber-800/90 dark:text-amber-300/80 space-y-2">
            <p>
              Standard passwords will fail if 2-Step Verification is enabled. Generate a 16-character
              <strong className="font-semibold text-amber-900 dark:text-amber-100"> App Password </strong>
              under your Google/Microsoft account security settings.
            </p>
            <a
              href="https://support.google.com/accounts/answer/185833"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 dark:text-amber-200 hover:underline pt-1"
            >
              <span>View Google App Passwords Setup</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      {/* Primary Fixed / Sticky CTA Button: Continue to Step 2 */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onContinue}
          className="w-full group flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 active:scale-[0.99] transition-all"
        >
          <span>Continue: Upload Contacts</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
        <p className="text-[11px] text-center text-slate-400 dark:text-zinc-500 mt-2">
          Next: CSV mapping, custom variables, and lead enrichment.
        </p>
      </div>
    </div>
  );
};
