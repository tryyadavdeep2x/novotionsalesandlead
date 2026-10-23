import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownCircle, RefreshCw, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import type { UpdateStatusData } from '../vite-env.d.js';

export const UpdateNotification: React.FC = () => {
  const [status, setStatus] = useState<UpdateStatusData>({ stage: 'idle' });
  const [dismissed, setDismissed] = useState(false);
  const [appVersion, setAppVersion] = useState<string>('');

  useEffect(() => {
    if (!window.electronAPI) return;

    // Fetch initial app version
    window.electronAPI.getAppVersion().then((v) => setAppVersion(v)).catch(() => {});

    // Listen to autoUpdater events from Electron main process
    const unsubscribe = window.electronAPI.onUpdateStatus((data) => {
      setStatus(data);
      if (data.stage === 'available' || data.stage === 'downloading' || data.stage === 'downloaded') {
        setDismissed(false);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  if (!window.electronAPI || dismissed) return null;
  if (status.stage === 'idle' || status.stage === 'not-available') return null;

  const handleRestart = () => {
    if (window.electronAPI?.restartAndInstallUpdate) {
      window.electronAPI.restartAndInstallUpdate();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl bg-slate-900/95 dark:bg-slate-950/95 border border-blue-500/30 text-white shadow-2xl backdrop-blur-md p-4 flex flex-col gap-2.5 font-sans"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {status.stage === 'downloading' && (
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 animate-pulse">
                <ArrowDownCircle className="h-5 w-5" />
              </div>
            )}
            {status.stage === 'downloaded' && (
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            )}
            {status.stage === 'available' && (
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <RefreshCw className="h-5 w-5 animate-spin" />
              </div>
            )}
            {status.stage === 'error' && (
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold text-white tracking-wide">
                {status.stage === 'downloading' && `Downloading Update ${status.percent ? `(${status.percent}%)` : ''}`}
                {status.stage === 'downloaded' && 'Update Ready to Install!'}
                {status.stage === 'available' && `New Version Detected: v${status.version || ''}`}
                {status.stage === 'error' && 'Update Check Failed'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {status.stage === 'downloading' && `Fetching release... ${appVersion ? `(Current: v${appVersion})` : ''}`}
                {status.stage === 'downloaded' && `Version ${status.version || ''} ready to apply ${appVersion ? `(replacing v${appVersion})` : ''}`}
                {status.stage === 'available' && `Starting background download... ${appVersion ? `(Current: v${appVersion})` : ''}`}
                {status.stage === 'error' && (status.error || 'Could not reach update server.')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-white bg-transparent border-none cursor-pointer transition-colors"
            title="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Progress bar for download */}
        {status.stage === 'downloading' && typeof status.percent === 'number' && (
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-500 h-1.5 transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, Math.max(5, status.percent))}%` }}
            />
          </div>
        )}

        {/* Action Button for downloaded state */}
        {status.stage === 'downloaded' && (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleRestart}
              className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer border-none flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Restart & Install Now</span>
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer border border-slate-700"
            >
              Later
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
