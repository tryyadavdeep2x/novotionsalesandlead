import React, { useState } from 'react';
import { NovotionLogo } from '../components/NovotionLogo.js';
import { BatchAllocateModal } from '../components/BatchAllocateModal.js';
import { ServerConfigModal } from '../components/ServerConfigModal.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../components/Toast.js';
import { UnifiedDashboardView } from '../components/UnifiedDashboardView.js';
import { SalesPipelineView } from '../components/SalesPipelineView.js';
import { LeadProfessionalsMonthlyView } from '../components/LeadProfessionalsMonthlyView.js';
import { SalesIndividualMonthlyDashboard } from '../components/SalesIndividualMonthlyDashboard.js';
import { GlobalSearchModal } from '../components/GlobalSearchModal.js';
import { NovotionEmailOnboarding } from '../components/email-automation/index.js';
import { 
  LogOut, Key, Sun, Moon, Search, LayoutDashboard, Briefcase, Users, Award, Plus, Copy, Check, X, Trash2, Zap, Mail, ExternalLink, Server
} from 'lucide-react';
import { apiFetch } from '../utils/api.js';

interface AccessKeyType {
  id: string;
  key: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export const AdminDashboard: React.FC = () => {
  const { logout, theme, toggleTheme } = useAuth();
  const { toastSuccess, toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'UNIFIED' | 'SALES' | 'LEADS_MONTHLY' | 'SALES_MONTHLY' | 'EMAIL_AUTOMATION' | 'KEYS'>('UNIFIED');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBatchAllocateOpen, setIsBatchAllocateOpen] = useState(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const isDesktop = typeof window !== 'undefined' && Boolean((window as any).electronAPI);

  // Access keys state
  const [keys, setKeys] = useState<AccessKeyType[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newKeyRole, setNewKeyRole] = useState<'LEAD_TEAM' | 'SALES_TEAM'>('LEAD_TEAM');
  const [keyError, setKeyError] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      const data = await apiFetch<AccessKeyType[]>('/api/admin/keys');
      setKeys(data);
    } catch (err: any) {
      console.error('Error fetching keys:', err);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'KEYS') fetchKeys();
  }, [activeTab]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError(null);
    if (!newKey.trim()) return;

    try {
      await apiFetch('/api/admin/keys', {
        method: 'POST',
        body: JSON.stringify({ key: newKey.trim(), role: newKeyRole }),
      });

      setNewKey('');
      toastSuccess(`Access Key "${newKey.trim()}" generated!`);
      fetchKeys();
    } catch (err: any) {
      setKeyError(err.message);
      toastError(err.message || 'Failed to create key.');
    }
  };

  const handleToggleKey = async (id: string, currentStatus: boolean) => {
    try {
      await apiFetch(`/api/admin/keys/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      toastSuccess(`Key status set to ${!currentStatus ? 'Active' : 'Inactive'}`);
      fetchKeys();
    } catch (err: any) {
      toastError(err.message || 'Failed to update key.');
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this access key?')) return;
    try {
      await apiFetch(`/api/admin/keys/${id}`, { method: 'DELETE' });
      toastSuccess('Access key revoked.');
      fetchKeys();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete key.');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toastSuccess(`${label} copied to clipboard!`);
  };

  return (
    <div className="min-h-screen bg-canvas text-foreground flex flex-col relative transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <NovotionLogo
            variant="header"
            badge="Executive Admin"
            badgeColor="purple"
            subtitle="CRM Command Center"
          />

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsBatchAllocateOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-200/60 dark:border-blue-800/60 cursor-pointer transition-all"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Auto-Allocate Leads</span>
            </button>

            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-medium border border-slate-200/60 dark:border-slate-700/60 cursor-pointer transition-colors"
            >
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <span>Search Leads...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-white dark:bg-slate-700 text-[10px] font-mono border border-slate-200 dark:border-slate-600 text-slate-400">
                ⌘K
              </kbd>
            </button>

            {isDesktop && (
              <button
                onClick={() => setIsServerModalOpen(true)}
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all cursor-pointer"
                title="Server Connection Settings"
              >
                <Server className="h-4 w-4 text-blue-500" />
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all cursor-pointer"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? <Moon className="h-4 w-4 text-slate-600" /> : <Sun className="h-4 w-4 text-amber-400" />}
            </button>

            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-800/50 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        {/* Navigation Tabs - Modern Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-slate-800/70 rounded-xl border border-slate-200/60 dark:border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('UNIFIED')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'UNIFIED'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Unified Dashboard
          </button>

          <button
            onClick={() => setActiveTab('SALES')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'SALES'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            Sales Pipeline
          </button>

          <button
            onClick={() => setActiveTab('LEADS_MONTHLY')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'LEADS_MONTHLY'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Lead Professionals Monthly
          </button>

          <button
            onClick={() => setActiveTab('SALES_MONTHLY')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'SALES_MONTHLY'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            Sales Reps Monthly
          </button>

          <button
            onClick={() => setActiveTab('EMAIL_AUTOMATION')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'EMAIL_AUTOMATION'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Mail className="h-3.5 w-3.5 text-indigo-500" />
            Email Automation
          </button>

          <button
            onClick={() => setActiveTab('KEYS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'KEYS'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            Access Keys
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="flex-1">
          {activeTab === 'UNIFIED' && (
            <UnifiedDashboardView
              onNavigateToSales={() => setActiveTab('SALES')}
            />
          )}

          {activeTab === 'SALES' && (
            <SalesPipelineView />
          )}

          {activeTab === 'LEADS_MONTHLY' && (
            <LeadProfessionalsMonthlyView />
          )}

          {activeTab === 'SALES_MONTHLY' && (
            <SalesIndividualMonthlyDashboard
              initialSalesRep="All Representatives"
              canChangeSalesRep={true}
            />
          )}

          {activeTab === 'EMAIL_AUTOMATION' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Novotion Email Automation Engine</h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold uppercase">Engine v2</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Multi-mailbox SMTP authentication, AI copywriting studio, dynamic contact spreadsheets, and batch campaign delivery.
                  </p>
                </div>
                <a
                  href="http://localhost:5050"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors shadow-xs shrink-0"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open Full Engine Studio (Port 5050)</span>
                </a>
              </div>
              <NovotionEmailOnboarding />
            </div>
          )}

          {activeTab === 'KEYS' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 glass-card rounded-2xl p-6 border-slate-200/80 dark:border-slate-800 h-fit shadow-xs bg-white dark:bg-slate-900">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                  <Key className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Generate Access Key
                </h3>

                {keyError && (
                  <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                    {keyError}
                  </div>
                )}

                <form onSubmit={handleCreateKey} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      Key Token String
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SALES_REP_2026"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs glow-input font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      Access Role Authorization
                    </label>
                    <select
                      value={newKeyRole}
                      onChange={(e) => setNewKeyRole(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs glow-input font-semibold"
                    >
                      <option value="LEAD_TEAM">LEAD_TEAM (Lead Specialist)</option>
                      <option value="SALES_TEAM">SALES_TEAM (Closing Sales)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-xs"
                  >
                    <Plus className="h-4 w-4" />
                    Allocate Key
                  </button>
                </form>
              </div>

              <div className="lg:col-span-8 glass-card rounded-2xl p-6 border-slate-200/80 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                <h3 className="text-sm font-semibold mb-4 text-slate-900 dark:text-white">Active Key Allocations</h3>

                <div className="space-y-2.5">
                  {keys.map((k) => (
                    <div
                      key={k.id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="font-semibold text-slate-900 dark:text-white text-xs bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 font-mono shadow-xs">
                            {k.key}
                          </code>
                          <button
                            onClick={() => copyToClipboard(k.key, 'Access Key')}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-none bg-transparent cursor-pointer"
                            title="Copy Key Token"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                            k.role === 'LEAD_TEAM'
                              ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-400'
                              : 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
                          }`}>
                            {k.role}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-1">
                          Created on {new Date(k.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleKey(k.id, k.isActive)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                            k.isActive
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                          }`}
                        >
                          {k.isActive ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                          {k.isActive ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => handleDeleteKey(k.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <BatchAllocateModal
        isOpen={isBatchAllocateOpen}
        onClose={() => setIsBatchAllocateOpen(false)}
        onAllocated={() => {}}
      />

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectSalesLead={() => setActiveTab('SALES')}
      />

      {isDesktop && (
        <ServerConfigModal
          isOpen={isServerModalOpen}
          onClose={() => setIsServerModalOpen(false)}
        />
      )}
    </div>
  );
};
