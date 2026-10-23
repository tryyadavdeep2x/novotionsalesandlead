import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch, exportToCSV } from '../utils/api.js';
import { useToast } from './Toast.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, XCircle, Clock, PhoneOff, 
  ChevronLeft, ChevronRight, Calendar, User, Users, Download, Edit, X, Search,
  Award
} from 'lucide-react';

interface SalesDashboardData {
  monthLabel: string;
  monthCode: string;
  priorMonthLabel: string;
  priorMonthCode: string;
  selectedSalesRep: string;
  availableSalesReps: string[];
  metrics: {
    totalRevenueUsd: number;          // 2. Total sales in amount in dollars
    totalClosedSales: number;         // 1. Total no of sales made
    convertedLeadsCount: number;      // 3. Total no of leads converted
    conversionRate: number;           // Conversion rate %
    unconvertedActiveLeads: number;   // 4. Total leads that are not converted
    lostDeals: number;                // 5. Lost leads
    noResponseLeads: number;          // 6. No response leads
    totalAssignedLeads: number;
  };
  deltas: {
    revenueDelta: number;
    closedSalesDelta: number;
    totalLeadsDelta: number;
    conversionRateDelta: number;
  };
  temperatureBreakdown: {
    cold: { count: number; pipelineUsd: number; percentage: number };
    warm: { count: number; pipelineUsd: number; percentage: number };
    hot: { count: number; pipelineUsd: number; percentage: number };
  };
  outcomeBreakdown: {
    converted: { count: number; revenueUsd: number; percentage: number };
    inProgress: { count: number; pipelineUsd: number; percentage: number };
    lost: { count: number; lostValueUsd: number; percentage: number };
    noResponse: { count: number; percentage: number };
  };
  leads: any[];
}

interface Props {
  initialSalesRep?: string;
  canChangeSalesRep?: boolean;
}

export const SalesIndividualMonthlyDashboard: React.FC<Props> = ({
  initialSalesRep = 'Michael Scott',
  canChangeSalesRep = true,
}) => {
  const { toastSuccess, toastError } = useToast();

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // August 2026
  const [selectedRep, setSelectedRep] = useState<string>(initialSalesRep);
  const [searchQuery, setSearchQuery] = useState('');

  const [data, setData] = useState<SalesDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Quick edit modal
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [editTemp, setEditTemp] = useState('Hot');
  const [editVisaStatus, setEditVisaStatus] = useState<string>('Citizen');
  const [editStatus, setEditStatus] = useState('Converted');
  const [editRep, setEditRep] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const monthCode = `${String(selectedMonth).padStart(2, '0')}-${selectedYear}`;

  const fetchSalesDashboard = async () => {
    setLoading(true);
    try {
      let url = `/api/sales-reps/dashboard?month=${monthCode}`;
      if (selectedRep) url += `&salesRep=${encodeURIComponent(selectedRep)}`;

      const res = await apiFetch<SalesDashboardData>(url);
      setData(res);
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch sales performance metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesDashboard();
  }, [monthCode, selectedRep]);

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

  const handleOpenEdit = (lead: any) => {
    setEditingLead(lead);
    setEditTemp(lead.temperature || 'Warm');
    setEditVisaStatus(lead.visaStatus || 'Citizen');
    setEditStatus(lead.currentStatus || 'Unconverted (Active)');
    setEditRep(lead.salesRepName || selectedRep);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;

    setSaveLoading(true);
    try {
      await apiFetch(`/api/leads/${editingLead.id}/quick-update`, {
        method: 'PUT',
        body: JSON.stringify({
          temperature: editTemp,
          visaStatus: editVisaStatus,
          currentStatus: editStatus,
          salesRepName: editRep,
        }),
      });

      toastSuccess(`Updated metrics for ${editingLead.candidateName}`);
      setEditingLead(null);
      fetchSalesDashboard();
    } catch (err: any) {
      toastError(err.message || 'Failed to update deal');
    } finally {
      setSaveLoading(false);
    }
  };

  const filteredLeads = useMemo(() => {
    if (!data?.leads) return [];
    return data.leads.filter((l) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        l.candidateName.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.salesRepName && l.salesRepName.toLowerCase().includes(q))
      );
    });
  }, [data?.leads, searchQuery]);

  const handleExportCSV = () => {
    if (!filteredLeads.length) return;
    const exportRows = filteredLeads.map((l) => ({
      Month: data?.monthLabel,
      SalesRepresentative: l.salesRepName || selectedRep,
      CandidateOrCompany: l.candidateName,
      Email: l.email,
      Phone: l.phoneNumber,
      Temperature: l.temperature,
      VisaStatus: l.visaStatus || 'Citizen',
      LinkedInUrl: l.linkedinUrl || '',
      CurrentStatus: l.currentStatus,
      DateAssigned: new Date(l.createdAt).toLocaleDateString(),
    }));

    exportToCSV(`sales_performance_${selectedRep.replace(/\s+/g, '_')}_${monthCode}`, exportRows);
    toastSuccess('Sales report exported to CSV!');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="glass-card rounded-3xl p-5 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-foreground">
                Sales Professional Monthly Performance Dashboard
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Individual revenue, closed sales, converted vs unconverted, lost, and unreached metrics.
              </p>
            </div>
          </div>
        </div>

        {/* Rep Selector + Month Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {canChangeSalesRep && data?.availableSalesReps && (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl px-3 py-1.5 border border-slate-200 dark:border-slate-700 shadow-xs">
              <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <select
                value={selectedRep}
                onChange={(e) => setSelectedRep(e.target.value)}
                className="bg-transparent border-none text-foreground text-xs font-black cursor-pointer focus:outline-none"
              >
                <option value="All Representatives">All Representatives (Company-Wide)</option>
                {data.availableSalesReps.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-1 border border-slate-200 dark:border-slate-700 shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer border-none bg-transparent"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="px-3 py-1 flex items-center gap-1.5 text-xs font-black text-foreground">
              <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>{data?.monthLabel || 'Loading...'}</span>
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
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-foreground text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            Current Month
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!filteredLeads.length}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            Export CSV
          </button>
        </div>
      </div>

      {/* 6 CORE SALES PERFORMANCE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* CARD 1: Total Assigned Leads */}
        <div className="glass-card rounded-3xl p-5 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Assigned Leads
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/25">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground mt-2">
            {data?.metrics.totalAssignedLeads || 0}
            <span className="text-xs text-slate-400 font-bold ml-1.5">Assigned Leads</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block font-semibold">
            Active candidate pool
          </span>
        </div>

        {/* CARD 2: Total Number of Sales Made */}
        <div className="glass-card rounded-3xl p-5 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total No. of Sales Made
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/25">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground mt-2">
            {data?.metrics.totalClosedSales || 0}
            <span className="text-xs text-slate-400 font-bold ml-1.5">Deals Won</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 mt-2">
            <span className={`${(data?.deltas.closedSalesDelta || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {(data?.deltas.closedSalesDelta || 0) >= 0 ? '+' : ''}{data?.deltas.closedSalesDelta || 0}%
            </span>
            <span>vs {data?.priorMonthLabel || 'prior month'}</span>
          </div>
        </div>

        {/* CARD 3: Total Leads Converted & Conversion Rate */}
        <div className="glass-card rounded-3xl p-5 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Leads Converted
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 border border-cyan-500/25">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-cyan-600 dark:text-cyan-400 mt-2">
            {data?.metrics.conversionRate || 0}%
            <span className="text-xs text-slate-400 font-bold ml-1.5">({data?.metrics.convertedLeadsCount || 0} Converted)</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 mt-2">
            <span className="text-slate-400">{data?.metrics.totalAssignedLeads || 0} Total Assigned</span>
          </div>
        </div>

        {/* CARD 4: Total Leads Not Converted */}
        <div className="glass-card rounded-3xl p-5 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Leads Not Converted (Active)
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/25">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {data?.metrics.unconvertedActiveLeads || 0}
            <span className="text-xs text-slate-400 font-bold ml-1.5">In Pipeline</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block font-semibold">
            Active Warm & Hot discussions
          </span>
        </div>

        {/* CARD 5: Lost Leads */}
        <div className="glass-card rounded-3xl p-5 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Lost Leads
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/25">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {data?.metrics.lostDeals || 0}
            <span className="text-xs text-slate-400 font-bold ml-1.5">Deals Lost</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block font-semibold">
            Declined or selected competitors
          </span>
        </div>

        {/* CARD 6: No Response Leads */}
        <div className="glass-card rounded-3xl p-5 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              No Response Leads
            </span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 border border-slate-200 dark:border-slate-700">
              <PhoneOff className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-600 dark:text-slate-300 mt-2">
            {data?.metrics.noResponseLeads || 0}
            <span className="text-xs text-slate-400 font-bold ml-1.5">Unreached</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block font-semibold">
            Max outreach attempts reached
          </span>
        </div>

      </div>

      {/* Outcome Funnel Meters */}
      <div className="glass-card rounded-3xl p-5 border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Monthly Outcome Distribution for {data?.selectedSalesRep}
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-lg block">
              {data?.outcomeBreakdown.converted.count || 0}
            </span>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Converted</span>
            <span className="text-[10px] text-emerald-600 block mt-0.5">Won Deals</span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25">
            <span className="font-extrabold text-amber-600 dark:text-amber-400 text-lg block">
              {data?.outcomeBreakdown.inProgress.count || 0}
            </span>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Active Pipeline</span>
            <span className="text-[10px] text-amber-600 block mt-0.5">In Follow-Up</span>
          </div>

          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25">
            <span className="font-extrabold text-rose-600 dark:text-rose-400 text-lg block">
              {data?.outcomeBreakdown.lost.count || 0}
            </span>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Lost Leads</span>
            <span className="text-[10px] text-rose-600 block mt-0.5">Closed / Lost</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <span className="font-extrabold text-slate-600 dark:text-slate-400 text-lg block">
              {data?.outcomeBreakdown.noResponse.count || 0}
            </span>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">No Response</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">0 Replies</span>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="glass-card rounded-3xl p-5 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Assigned Leads in {data?.monthLabel} ({filteredLeads.length})
          </h3>

          <div className="relative min-w-[260px]">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search candidate, email, rep..."
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

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Lead / Company</th>
                <th className="py-3 px-4">Temperature</th>
                <th className="py-3 px-4">Visa Status</th>
                <th className="py-3 px-4">Outcome Status</th>
                <th className="py-3 px-4">Assigned Sales Rep</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    Loading sales records...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs font-semibold">
                    No leads assigned for {data?.selectedSalesRep} in {data?.monthLabel}.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors text-xs">
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      {l.candidateName}
                      <p className="text-[11px] text-slate-400 font-normal">{l.email} &bull; {l.phoneNumber}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        l.temperature === 'Hot' ? 'bg-rose-500/10 text-rose-600' :
                        l.temperature === 'Warm' ? 'bg-amber-500/10 text-amber-600' :
                        'bg-sky-500/10 text-sky-600'
                      }`}>
                        {l.temperature}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {l.visaStatus || 'Citizen'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        l.currentStatus === 'Converted' ? 'bg-emerald-500/10 text-emerald-600' :
                        l.currentStatus === 'Lost' ? 'bg-rose-500/10 text-rose-600' :
                        l.currentStatus === 'No Response' ? 'bg-slate-100 text-slate-500' :
                        'bg-blue-500/10 text-blue-600'
                      }`}>
                        {l.currentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-foreground/90">
                      {l.salesRepName || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(l)}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer shadow-xs"
                        title="Quick Edit Deal"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Edit Modal */}
      <AnimatePresence>
        {editingLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingLead(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md glass-card rounded-3xl p-6 relative z-10 border-slate-200 dark:border-slate-800 shadow-2xl text-foreground text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                <h3 className="text-base font-bold text-foreground">
                  Update Monthly Deal Metrics
                </h3>
                <button
                  onClick={() => setEditingLead(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Candidate / Company
                  </label>
                  <div className="font-bold text-sm text-foreground bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    {editingLead.candidateName}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Temperature Tier
                    </label>
                    <select
                      value={editTemp}
                      onChange={(e) => setEditTemp(e.target.value)}
                      className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input font-bold"
                    >
                      <option value="Hot">🔥 Hot</option>
                      <option value="Warm">⚡ Warm</option>
                      <option value="Cold">❄️ Cold</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Visa Status
                    </label>
                    <select
                      value={editVisaStatus}
                      onChange={(e) => setEditVisaStatus(e.target.value)}
                      className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input font-bold"
                    >
                      <option value="Citizen">Citizen</option>
                      <option value="Green Card">Green Card</option>
                      <option value="H-1B">H-1B</option>
                      <option value="L-1 / L-2">L-1 / L-2</option>
                      <option value="F-1 OPT">F-1 OPT</option>
                      <option value="TN Visa">TN Visa</option>
                      <option value="E-3 / Other">E-3 / Other</option>
                      <option value="Work Permit">Work Permit</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Monthly Outcome Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input font-bold"
                  >
                    <option value="Converted">Converted (Sale Won)</option>
                    <option value="Unconverted (Active)">Unconverted (Active in Pipeline)</option>
                    <option value="Lost">Lost Deal</option>
                    <option value="No Response">No Response</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Assigned Sales Representative
                  </label>
                  <input
                    type="text"
                    value={editRep}
                    onChange={(e) => setEditRep(e.target.value)}
                    className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingLead(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-foreground text-xs font-bold cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer border-none shadow-md shadow-blue-600/20"
                  >
                    {saveLoading ? 'Updating...' : 'Save Metrics'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
