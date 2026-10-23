import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../utils/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../components/Toast.js';
import { NovotionLogo } from '../components/NovotionLogo.js';
import { LeadDetailModal } from '../components/LeadDetailModal.js';
import { GlobalSearchModal } from '../components/GlobalSearchModal.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PhoneCall, Mail, Search, X, MessageSquare, 
  Flame, Zap, Snowflake, Sun, Moon, LogOut, Send, 
  RefreshCw, PhoneForwarded, Calendar, Linkedin
} from 'lucide-react';

interface LeadType {
  id: string;
  candidateName: string;
  phoneNumber: string;
  email: string;
  visaStatus: string;
  linkedinUrl: string;
  chatBrief: string;
  jobProfile: string;
  stage: 'New' | 'Contacted' | 'Proposal Sent' | 'Won' | 'Lost';
  temperature?: 'Hot' | 'Warm' | 'Cold';
  isCold?: boolean;
  currentStatus: string;
  dealValueUsd: number;
  salesRepName?: string;
  nextFollowUpDate?: string;
  createdAt: string;
  statusUpdatedAt?: string;
  interactions?: Array<{
    id: string;
    salesRepName: string;
    status: string;
    candidateFeedback: string;
    updatedAt: string;
  }>;
}

export const SalesDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { toastSuccess, toastError } = useToast();

  const [leads, setLeads] = useState<LeadType[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedRep, setSelectedRep] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [tempFilter, setTempFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Call Logger
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [callLogLead, setCallLogLead] = useState<LeadType | null>(null);
  const [callStatus, setCallStatus] = useState<string>('Interested');
  const [callNotes, setCallNotes] = useState<string>('');
  const [nextFollowUp, setNextFollowUp] = useState<string>('');
  const [submittingCall, setSubmittingCall] = useState(false);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      document.documentElement.classList.add('dark');
      setTheme('dark');
      localStorage.setItem('novotion_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      setTheme('light');
      localStorage.setItem('novotion_theme', 'light');
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<LeadType[]>('/api/leads');
      setLeads(data);
    } catch (err: any) {
      toastError(err.message || 'Failed to load assigned leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Unique list of sales reps from leads
  const availableReps = useMemo(() => {
    const set = new Set<string>();
    leads.forEach(l => {
      if (l.salesRepName) set.add(l.salesRepName);
    });
    return Array.from(set);
  }, [leads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      if (selectedRep !== 'ALL' && l.salesRepName !== selectedRep) return false;
      if (statusFilter !== 'ALL' && (l.currentStatus || 'No Response') !== statusFilter) return false;
      if (tempFilter !== 'ALL' && (l.temperature || (l.isCold ? 'Cold' : 'Warm')) !== tempFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        l.candidateName.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phoneNumber.toLowerCase().includes(q) ||
        (l.jobProfile && l.jobProfile.toLowerCase().includes(q)) ||
        (l.salesRepName && l.salesRepName.toLowerCase().includes(q)) ||
        (l.chatBrief && l.chatBrief.toLowerCase().includes(q))
      );
    });
  }, [leads, selectedRep, statusFilter, tempFilter, searchQuery]);

  // Metrics
  const stats = useMemo(() => {
    const totalAssigned = leads.length;
    const interested = leads.filter(l => l.currentStatus === 'Interested' || l.currentStatus === 'Maybe Interested').length;
    const noResponse = leads.filter(l => !l.currentStatus || l.currentStatus === 'No Response').length;
    const converted = leads.filter(l => l.currentStatus === 'Converted' || l.stage === 'Won').length;

    return { totalAssigned, interested, noResponse, converted };
  }, [leads]);

  const handleOpenCallLog = (lead: LeadType) => {
    setCallLogLead(lead);
    setCallStatus(lead.currentStatus || 'Interested');
    setCallNotes('');
    setNextFollowUp(lead.nextFollowUpDate ? lead.nextFollowUpDate.split('T')[0] : '');
  };

  const handleSaveCallLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callLogLead) return;
    if (!callNotes.trim()) {
      toastError('Please enter notes from your conversation with the candidate.');
      return;
    }

    setSubmittingCall(true);
    try {
      const author = user?.identifier || 'Sales Specialist';

      // 1. Post interaction / call note
      await apiFetch('/api/sales/interaction', {
        method: 'POST',
        body: JSON.stringify({
          leadId: callLogLead.id,
          salesRepName: author,
          status: callStatus,
          candidateFeedback: callNotes.trim(),
        }),
      });

      toastSuccess(`Call outcome logged for ${callLogLead.candidateName}! Admin can now view this update.`);
      setCallLogLead(null);
      fetchLeads();
    } catch (err: any) {
      toastError(err.message || 'Failed to save call outcome');
    } finally {
      setSubmittingCall(false);
    }
  };

  const handleQuickStatusChange = async (leadId: string, candidateName: string, newStatus: string) => {
    try {
      await apiFetch(`/api/leads/${leadId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: newStatus,
          commentNotes: `Status changed to "${newStatus}"`,
          salesRepName: user?.identifier || 'Sales Specialist',
        }),
      });
      toastSuccess(`Updated ${candidateName} to "${newStatus}"`);
      fetchLeads();
    } catch (err: any) {
      toastError(err.message || 'Failed to update status');
    }
  };

  const getTemperatureBadge = (temp: string = 'Warm') => {
    switch (temp) {
      case 'Hot':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <Flame className="h-3 w-3" /> Hot Lead
          </span>
        );
      case 'Cold':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <Snowflake className="h-3 w-3" /> Cold Lead
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Zap className="h-3 w-3" /> Warm Lead
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-foreground flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] bg-emerald-600/5 dark:bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Clean Sales Header */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <NovotionLogo
            variant="header"
            badge="Sales Representative"
            badgeColor="blue"
            subtitle="Candidate Calling & Lead Follow-Up Workspace"
          />

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-foreground text-xs font-semibold border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors shadow-xs"
            >
              <Search className="h-3.5 w-3.5 text-blue-600" />
              <span>Search candidate...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 text-[10px] font-mono border border-slate-200 dark:border-slate-600">⌘K</kbd>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-xs"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? <Moon className="h-4.5 w-4.5 text-slate-700" /> : <Sun className="h-4.5 w-4.5 text-amber-400" />}
            </button>

            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition-colors cursor-pointer shadow-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10 space-y-6">
        {/* Quick Pipeline Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="glass-card rounded-2xl p-4 border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Assigned Leads</span>
            <div className="text-2xl font-black text-foreground">{stats.totalAssigned}</div>
            <span className="text-[11px] text-slate-500 font-medium">In your sales pool</span>
          </div>

          <div className="glass-card rounded-2xl p-4 border-emerald-500/20 shadow-sm bg-gradient-to-br from-emerald-500/5 to-transparent">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">Interested</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.interested}</div>
            <span className="text-[11px] text-slate-500 font-medium">Ready for closing</span>
          </div>

          <div className="glass-card rounded-2xl p-4 border-amber-500/20 shadow-sm bg-gradient-to-br from-amber-500/5 to-transparent">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">Needs Follow-Up</span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.noResponse}</div>
            <span className="text-[11px] text-slate-500 font-medium">Unreached / No response</span>
          </div>

          <div className="glass-card rounded-2xl p-4 border-purple-500/20 shadow-sm bg-gradient-to-br from-purple-500/5 to-transparent">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-1">Converted Won</span>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{stats.converted}</div>
            <span className="text-[11px] text-slate-500 font-medium">Deals successfully closed</span>
          </div>

          <div className="glass-card rounded-2xl p-4 border-blue-500/20 shadow-sm col-span-2 sm:col-span-1 bg-gradient-to-br from-blue-500/5 to-transparent">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">Active Pipeline</span>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.totalAssigned}</div>
            <span className="text-[11px] text-slate-500 font-medium">Total registered leads</span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="glass-card rounded-3xl p-5 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200 dark:border-slate-700 text-xs font-bold gap-1">
              {(['ALL', 'Interested', 'Maybe Interested', 'No Response', 'Not Interested', 'Converted'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  {st === 'ALL' ? 'All Leads' : st}
                </button>
              ))}
            </div>

            {/* Rep & Temp Filter and Search */}
            <div className="flex flex-wrap items-center gap-2">
              {availableReps.length > 0 && (
                <select
                  value={selectedRep}
                  onChange={(e) => setSelectedRep(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none shadow-xs"
                >
                  <option value="ALL">All Sales Representatives</option>
                  {availableReps.map(rep => (
                    <option key={rep} value={rep}>{rep}</option>
                  ))}
                </select>
              )}

              <select
                value={tempFilter}
                onChange={(e) => setTempFilter(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none shadow-xs"
              >
                <option value="ALL">All Priority Tiers</option>
                <option value="Hot">🔥 Hot Leads</option>
                <option value="Warm">⚡ Warm Leads</option>
                <option value="Cold">❄️ Cold Leads</option>
              </select>

              <div className="relative min-w-[220px]">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search candidate or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-7 py-2 text-xs text-foreground glow-input"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={fetchLeads}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-all cursor-pointer shadow-xs"
                title="Refresh Leads"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Simple Clean Leads Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Candidate / Lead</th>
                  <th className="py-3.5 px-4">Direct Contact</th>
                  <th className="py-3.5 px-4">Priority (Admin Tag)</th>
                  <th className="py-3.5 px-4">Operational Status</th>
                  <th className="py-3.5 px-4">Assigned To</th>
                  <th className="py-3.5 px-4">Visa Status</th>
                  <th className="py-3.5 px-4 text-right">Call Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading assigned sales leads...
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No leads found matching current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Candidate Name & Job Profile */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLeadId(lead.id);
                            setIsDetailOpen(true);
                          }}
                          className="text-left font-bold text-sm text-foreground hover:text-blue-600 transition-colors cursor-pointer border-none bg-transparent p-0 block"
                        >
                          {lead.candidateName}
                        </button>
                        <span className="text-[11px] text-slate-400 font-normal block mt-0.5">
                          {lead.jobProfile || 'Opportunity'}
                        </span>
                      </td>

                      {/* Direct Clickable Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <a
                            href={`tel:${lead.phoneNumber}`}
                            className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200 hover:text-emerald-600 font-bold"
                          >
                            <PhoneCall className="h-3 w-3 text-emerald-500" />
                            {lead.phoneNumber}
                          </a>
                          <a
                            href={`mailto:${lead.email}`}
                            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-blue-600 text-[11px]"
                          >
                            <Mail className="h-3 w-3 text-blue-500" />
                            {lead.email}
                          </a>
                          {lead.linkedinUrl && lead.linkedinUrl !== 'https://linkedin.com' && (
                            <a
                              href={lead.linkedinUrl.startsWith('http') ? lead.linkedinUrl : `https://${lead.linkedinUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-[11px] font-semibold"
                            >
                              <Linkedin className="h-3 w-3 text-blue-600" />
                              LinkedIn Profile
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Admin Priority Temperature */}
                      <td className="py-3.5 px-4">
                        {getTemperatureBadge(lead.temperature || (lead.isCold ? 'Cold' : 'Warm'))}
                      </td>

                      {/* Operational Status Dropdown */}
                      <td className="py-3.5 px-4">
                        <select
                          value={lead.currentStatus || 'No Response'}
                          onChange={(e) => handleQuickStatusChange(lead.id, lead.candidateName, e.target.value)}
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-extrabold text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
                        >
                          <option value="Interested">Interested</option>
                          <option value="Maybe Interested">Maybe Interested</option>
                          <option value="No Response">No Response</option>
                          <option value="Not Interested">Not Interested</option>
                          <option value="Converted">Converted</option>
                        </select>
                      </td>

                      {/* Assigned Sales Specialist */}
                      <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">
                        {lead.salesRepName || 'Unassigned'}
                      </td>

                      {/* Visa Status */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {lead.visaStatus || 'Citizen'}
                        </span>
                      </td>

                      {/* Call Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenCallLog(lead)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer border-none shadow-xs"
                          >
                            <PhoneForwarded className="h-3.5 w-3.5" />
                            <span>Log Call</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLeadId(lead.id);
                              setIsDetailOpen(true);
                            }}
                            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-foreground transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs"
                            title="View Full History Timeline"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Slide-in Modal: Log Call & Update Status (Instant Realtime Sync with Admin) */}
      <AnimatePresence>
        {callLogLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCallLogLead(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg glass-card rounded-3xl p-6 relative z-10 border-slate-200 dark:border-slate-800 shadow-2xl text-foreground text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
                    <PhoneForwarded className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-foreground">Log Call Outcome</h3>
                    <p className="text-xs text-slate-400 font-medium">{callLogLead.candidateName} &bull; {callLogLead.phoneNumber}</p>
                  </div>
                </div>

                <button
                  onClick={() => setCallLogLead(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCallLog} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Call Outcome Status *
                    </label>
                    <select
                      value={callStatus}
                      onChange={(e) => setCallStatus(e.target.value)}
                      className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-foreground text-xs font-bold glow-input"
                      required
                    >
                      <option value="Interested">Interested (High Intent / Wants Quote)</option>
                      <option value="Maybe Interested">Maybe Interested (Evaluating)</option>
                      <option value="No Response">No Response (Left Voicemail / Busy)</option>
                      <option value="Not Interested">Not Interested (No Current Need)</option>
                      <option value="Converted">Converted (Deal Won & Closed)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-blue-500" />
                      Next Follow-Up Date
                    </label>
                    <input
                      type="date"
                      value={nextFollowUp}
                      onChange={(e) => setNextFollowUp(e.target.value)}
                      className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input"
                    />
                  </div>
                </div>

                <div className="hidden">
                  <select
                    value={callStatus}
                    onChange={(e) => setCallStatus(e.target.value)}
                    className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-foreground text-xs font-bold glow-input"
                    required
                  >
                    <option value="Interested">Interested (High Intent / Wants Quote)</option>
                    <option value="Maybe Interested">Maybe Interested (Requested Info / Evaluating)</option>
                    <option value="No Response">No Response (Left Voicemail / Busy)</option>
                    <option value="Not Interested">Not Interested (No Current Need)</option>
                    <option value="Converted">Converted (Deal Won & Closed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Candidate Conversation Notes & Discussion Details *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe candidate feedback, objection handling, requested deliverables, budget discussion..."
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input resize-none"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    * Logged notes are permanently appended to the lead's history and visible to Administrators.
                  </span>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCallLogLead(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer border-none"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submittingCall || !callNotes.trim()}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer border-none shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {submittingCall ? 'Saving...' : 'Save Call Outcome & Update Admin'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Detail & Timeline Modal */}
      <LeadDetailModal
        leadId={selectedLeadId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedLeadId(null);
        }}
        onLeadUpdated={fetchLeads}
      />

      {/* Global Search */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectSalesLead={(id) => {
          setSelectedLeadId(id);
          setIsDetailOpen(true);
        }}
      />
    </div>
  );
};
