import { ServerConfigModal } from '../components/ServerConfigModal.js';
import { getServerUrl, checkServerHealth } from '../utils/api.js';
import { Server } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { motion } from 'framer-motion';
import { KeyRound, UserCheck, AlertTriangle, Moon, Sun, ShieldCheck, Sparkles } from 'lucide-react';
import { NovotionLogo } from '../components/NovotionLogo.js';

export const Login: React.FC = () => {
  const { loginKey, loginAdmin, theme, toggleTheme } = useAuth();
  const [loginType, setLoginType] = useState<'KEY' | 'ADMIN'>('KEY');
  const [accessKey, setAccessKey] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);

  useEffect(() => {
    checkServerHealth().then(res => setServerOnline(res.ok));
  }, []);

  const handleKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKey.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await loginKey(accessKey.trim());
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate access key.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await loginAdmin(username.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate admin.');
    } finally {
      setLoading(false);
    }
  };

  const quickFillKey = (key: string) => {
    setLoginType('KEY');
    setAccessKey(key);
    setError(null);
  };

  const quickFillAdmin = () => {
    setLoginType('ADMIN');
    setUsername('admin');
    setPassword('AdminPassword123!');
    setError(null);
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-canvas text-foreground px-4 py-8 transition-colors duration-200">
      {/* Theme Toggle Button */}
      <div className="absolute top-5 right-5 z-20">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-xs"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon className="h-4 w-4 text-slate-600" /> : <Sun className="h-4 w-4 text-amber-400" />}
        </button>
      </div>

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md glass-card rounded-2xl p-7 sm:p-8 relative z-10 border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900"
      >
        {/* Brand header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <NovotionLogo
            variant="full"
            size="md"
            subtitle="Sales &amp; Lead Management Portal"
          />
        </div>

        {/* Tab switches */}
        <div className="flex bg-slate-100/80 dark:bg-slate-800/80 rounded-xl p-1 mb-5 border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => {
              setLoginType('KEY');
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              loginType === 'KEY'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            Access Key
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginType('ADMIN');
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              loginType === 'ADMIN'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            Admin Portal
          </button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs mb-5 font-medium"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Access key form */}
        {loginType === 'KEY' ? (
          <form onSubmit={handleKeySubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Shared Access Key
              </label>
              <input
                type="password"
                placeholder="e.g. LEAD_KEY_2026"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 text-xs glow-input font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border-none shadow-xs mt-2"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Authenticate Access
                </>
              )}
            </button>
          </form>
        ) : (
          /* Admin credentials form */
          <form onSubmit={handleAdminSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Admin Username
              </label>
              <input
                type="text"
                placeholder="Username (e.g. admin)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 text-xs glow-input"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 text-xs glow-input"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border-none shadow-xs mt-2"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Admin Secure Login
                </>
              )}
            </button>
          </form>
        )}

        {/* Server Connection Status */}
        <div className="mt-5 flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-[11px]">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${serverOnline === true ? 'bg-emerald-500 animate-pulse' : serverOnline === false ? 'bg-rose-500' : 'bg-amber-400'}`} />
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">
              {getServerUrl().replace(/^https?:\/\//, '')}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsServerModalOpen(true)}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-[11px] bg-transparent border-none cursor-pointer flex items-center gap-1"
          >
            <Server className="h-3 w-3" />
            Change Server
          </button>
        </div>

        {/* Demo Quick-Fill Assistant */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="h-3 w-3 text-blue-500" />
            Quick Demo Credentials
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => quickFillKey('LEAD_KEY_2026')}
              className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium border border-slate-200/60 dark:border-slate-700/60 cursor-pointer transition-colors"
            >
              Lead Specialist
            </button>
            <button
              type="button"
              onClick={() => quickFillKey('SALES_KEY_2026')}
              className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium border border-slate-200/60 dark:border-slate-700/60 cursor-pointer transition-colors"
            >
              Sales Closer
            </button>
            <button
              type="button"
              onClick={quickFillAdmin}
              className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium border border-slate-200/60 dark:border-slate-700/60 cursor-pointer transition-colors"
            >
              IT Admin
            </button>
          </div>
        </div>
      </motion.div>

      <ServerConfigModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        onSaved={() => checkServerHealth().then(res => setServerOnline(res.ok))}
      />
    </div>
  );
};
