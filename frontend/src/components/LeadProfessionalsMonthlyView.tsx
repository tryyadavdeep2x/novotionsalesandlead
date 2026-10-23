import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch, exportToCSV } from '../utils/api.js';
import { useToast } from './Toast.js';
import { LeadDetailModal } from './LeadDetailModal.js';
import { 
  Users, Flame, Zap, Snowflake, Download, ChevronLeft, ChevronRight, 
  Calendar, Search, X, Award, MessageSquare, Linkedin
} from 'lucide-react';

interface CreatorStat {
  name: string;
  total: number;
  cold: number;
  warm: number;
  hot: number;
  totalValueUsd: number;
}

interface MonthlyLeadData {
  monthLabel: string;
  monthCode: string;
  totalMonthlyLeads: number;
  filteredCount: number;
  tiers: {
    cold: { count: number; dealValueUsd: number; percentage: number; converted: number; inProgress: number; lost: number; noResponse: number };
    warm: { count: number; dealValueUsd: number; percentage: number; converted: number; inProgress: number; lost: number; noResponse: number };
    hot: { count: number; dealValueUsd: number; percentage: number; converted: number; inProgress: number; lost: number; noResponse: number };
  };
  creatorBreakdown: CreatorStat[];
  availableCreators: string[];
  leads: any[];
}

export const LeadProfessionalsMonthlyView: React.FC = () => {
  const { toastSuccess, toastError } = useToast();
  
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // 1-12
  
  const [selectedCreator, setSelectedCreator] = useState<string>('ALL');
  const [selectedTier, setSelectedTier] = useState<'ALL' | 'hot' | 'warm' | 'cold'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [data, setData] = useState<MonthlyLeadData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const monthCode = `${String(selectedMonth).padStart(2, '0')}-${selectedYear}`;

  const fetchMonthlyLeads = async () => {
    setLoading(true);
    try {
      let url = `/api/leads/monthly?month=${monthCode}`;
      if (selectedCreator !== 'ALL') url += `&creator=${encodeURIComponent(selectedCreator)}`;
      if (selectedTier !== 'ALL') url += `&temperature=${selectedTier}`;

      const res = await apiFetch<MonthlyLeadData>(url);
      setData(res);
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch monthly lead aggregation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyLeads();
  }, [monthCode, selectedCreator, selectedTier]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const handleCurrentMonth = () => {
    setSelectedYear(2026);
    setSelectedMonth(8);
  };

  const getTierBadge = (temp: string) => {
    const t = (temp || '').toLowerCase();
    if (t === 'hot') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">
          <Flame className="h-3 w-3" /> Hot Lead
        </span>
      );
    }
    if (t === 'cold') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25">
          <Snowflake className="h-3 w-3" /> Cold Lead
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
        <Zap className="h-3 w-3" /> Warm Lead
      </span>
    );
  };

  const filteredLeads = useMemo(() => {
    if (!data?.leads) return [];
    return data.leads.filter(l => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (l.candidateName && l.candidateName.toLowerCase().includes(q)) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.phoneNumber && l.phoneNumber.toLowerCase().includes(q)) ||
        (l.jobTitle && l.jobTitle.toLowerCase().includes(q)) ||
        (l.jobProfile && l.jobProfile.toLowerCase().includes(q)) ||
        (l.sourcedBy && l.sourcedBy.toLowerCase().includes(q)) ||
        (l.sourcedFrom && l.sourcedFrom.toLowerCase().includes(q)) ||
        (l.attemptedBy && l.attemptedBy.toLowerCase().includes(q)) ||
        (l.createdByName && l.createdByName.toLowerCase().includes(q))
      );
    });
  }, [data?.leads, searchQuery]);

  const handleExport = () => {
    if (!filteredLeads || filteredLeads.length === 0) return;
    const exportData = filteredLeads.map(l => ({
      CandidateName: l.candidateName || 'Unnamed Lead',
      JobTitle: l.jobTitle || l.jobProfile || '',
      Email: l.email || '',
      Phone: l.phoneNumber || '',
      VisaStatus: l.visaStatus || '',
      LinkedInUrl: l.linkedInUrl || l.linkedinUrl || '',
      SourcedBy: l.sourcedBy || l.createdByName || '',
      SourcedFrom: l.sourcedFrom || '',
      AttemptedBy: l.attemptedBy || l.salesRepName || '',
      ChatBrief: l.chatBrief || '',
      LeadSpecialist: l.createdByName,
      Temperature: l.temperature,
      CurrentStatus: l.currentStatus,
      LoggedDate: new Date(l.createdAt).toLocaleDateString(),
    }));
    exportToCSV(`novotion_monthly_leads_${monthCode}`, exportData);
    toastSuccess('Monthly leads export downloaded!');
  };

  return (
    <div className="space-y-6">
      {/* Month Selector Header */}
      <div className="glass-card rounded-3xl p-5 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Monthly Lead Generation Aggregation
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Real-time monthly aggregation of leads logged by Lead Generation Specialists.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-1 border border-slate-200 dark:border-slate-700 shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer border-none bg-transparent"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="px-3 font-extrabold text-xs text-foreground min-w-[130px] text-center flex items-center justify-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-blue-600" />
              {data?.monthLabel || 'Loading...'}
            </div>

            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer border-none bg-transparent"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handleCurrentMonth}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-xs"
          >
            Current Month
          </button>

          <button
            onClick={handleExport}
            disabled={filteredLeads.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Tier Breakdown Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Hot Lead Tier */}
          <div className="glass-card rounded-3xl p-5 border-rose-500/20 shadow-sm relative overflow-hidden bg-gradient-to-br from-rose-500/5 via-transparent to-transparent">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-foreground">Hot Leads Tier</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">High conversion intent</p>
                </div>
              </div>
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
                {data.tiers.hot.percentage}% of Month
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-black text-foreground">{data.tiers.hot.count}</span>
              <span className="text-xs font-bold text-slate-400">Leads Logged</span>
            </div>

            <div className="pt-3 border-t border-rose-500/15 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Outcome Status</span>
              <span className="font-extrabold text-rose-600 dark:text-rose-400">{data.tiers.hot.converted} Converted</span>
            </div>
          </div>

          {/* Warm Lead Tier */}
          <div className="glass-card rounded-3xl p-5 border-amber-500/20 shadow-sm relative overflow-hidden bg-gradient-to-br from-amber-500/5 via-transparent to-transparent">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-foreground">Warm Leads Tier</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">In discussion / qualified</p>
                </div>
              </div>
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                {data.tiers.warm.percentage}% of Month
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-black text-foreground">{data.tiers.warm.count}</span>
              <span className="text-xs font-bold text-slate-400">Leads Logged</span>
            </div>

            <div className="pt-3 border-t border-amber-500/15 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Active Engagement</span>
              <span className="font-extrabold text-amber-600 dark:text-amber-400">{data.tiers.warm.inProgress + data.tiers.warm.converted} In Discussion</span>
            </div>
          </div>

          {/* Cold Lead Tier */}
          <div className="glass-card rounded-3xl p-5 border-sky-500/20 shadow-sm relative overflow-hidden bg-gradient-to-br from-sky-500/5 via-transparent to-transparent">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <Snowflake className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-foreground">Cold Leads Tier</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Uncontacted discovery pool</p>
                </div>
              </div>
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-600 border border-sky-500/20">
                {data.tiers.cold.percentage}% of Month
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-black text-foreground">{data.tiers.cold.count}</span>
              <span className="text-xs font-bold text-slate-400">Leads Logged</span>
            </div>

            <div className="pt-3 border-t border-sky-500/15 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Discovery Pool</span>
              <span className="font-extrabold text-sky-600 dark:text-sky-400">{data.tiers.cold.count} Registered</span>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {data?.creatorBreakdown && data.creatorBreakdown.length > 0 && (
        <div className="glass-card rounded-3xl p-5 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-amber-500" />
              Lead Professionals Performance in {data.monthLabel}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Ranked by volume</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {data.creatorBreakdown.map((creator, idx) => (
              <div
                key={creator.name}
                onClick={() => setSelectedCreator(selectedCreator === creator.name ? 'ALL' : creator.name)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all text-xs ${
                  selectedCreator === creator.name
                    ? 'bg-blue-500/10 border-blue-500 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-foreground">{creator.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold">
                    #{idx + 1}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mb-2">
                  Total: <strong className="text-foreground">{creator.total} Leads Registered</strong>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600">🔥 {creator.hot}</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600">⚡ {creator.warm}</span>
                  <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600">❄️ {creator.cold}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filterable Leads Table */}
      <div className="glass-card rounded-3xl p-5 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200 dark:border-slate-700 text-xs font-bold gap-1">
              {(['ALL', 'hot', 'warm', 'cold'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTier(t)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedTier === t
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  {t === 'ALL' ? 'All Tiers' : t === 'hot' ? '🔥 Hot' : t === 'warm' ? '⚡ Warm' : '❄️ Cold'}
                </button>
              ))}
            </div>

            {data?.availableCreators && data.availableCreators.length > 0 && (
              <select
                value={selectedCreator}
                onChange={(e) => setSelectedCreator(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-foreground text-xs glow-input font-bold shadow-xs"
              >
                <option value="ALL">All Lead Professionals</option>
                {data.availableCreators.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>

          <div className="relative min-w-[260px]">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search candidate, job, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-7 py-2 text-foreground text-xs glow-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-foreground border-none bg-transparent cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Lead / Candidate</th>
                <th className="py-3 px-4">Lead Professional</th>
                <th className="py-3 px-4">Priority Temperature</th>
                <th className="py-3 px-4">Operational Status</th>
                <th className="py-3 px-4">Visa Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Loading monthly leads data...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs font-semibold">
                    No leads found for {data?.monthLabel} matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors text-xs">
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLeadId(l.id);
                          setIsDetailOpen(true);
                        }}
                        className="text-left font-bold text-foreground hover:text-blue-600 transition-colors cursor-pointer border-none bg-transparent p-0 block"
                      >
                        {l.candidateName || 'Unnamed Lead'}
                      </button>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 font-normal mt-0.5">
                        {(l.jobTitle || l.jobProfile) && (
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {l.jobTitle || l.jobProfile}
                          </span>
                        )}
                        {l.email && <span>{l.email}</span>}
                        {l.phoneNumber && <span>&bull; {l.phoneNumber}</span>}
                        {l.sourcedFrom && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-blue-600 dark:text-blue-400 font-semibold border border-slate-200 dark:border-slate-700">
                            {l.sourcedFrom}
                          </span>
                        )}
                        {(l.linkedInUrl || l.linkedinUrl) && (l.linkedInUrl !== 'https://linkedin.com' && l.linkedinUrl !== 'https://linkedin.com') && (
                          <a
                            href={(l.linkedInUrl || l.linkedinUrl).startsWith('http') ? (l.linkedInUrl || l.linkedinUrl) : `https://${l.linkedInUrl || l.linkedinUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-700"
                            title="Open LinkedIn Profile"
                          >
                            <Linkedin className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-blue-600 dark:text-blue-400">
                      {l.createdByName}
                    </td>

                    <td className="py-3.5 px-4">
                      {getTierBadge(l.temperature)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        l.currentStatus === 'Converted' ? 'bg-emerald-500/10 text-emerald-600' :
                        l.currentStatus === 'Lost' || l.currentStatus === 'Not Interested' ? 'bg-rose-500/10 text-rose-600' :
                        l.currentStatus === 'No Response' ? 'bg-amber-500/10 text-amber-600' :
                        'bg-blue-500/10 text-blue-600'
                      }`}>
                        {l.currentStatus || 'No Response'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {l.visaStatus || 'Citizen'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(l.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLeadId(l.id);
                          setIsDetailOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors cursor-pointer border-none inline-flex items-center gap-1 font-bold text-[11px]"
                        title="View Timeline"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Timeline</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unified Read-Only Lead Detail & Timeline Modal */}
      <LeadDetailModal
        leadId={selectedLeadId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedLeadId(null);
        }}
        onLeadUpdated={fetchMonthlyLeads}
      />
    </div>
  );
};
