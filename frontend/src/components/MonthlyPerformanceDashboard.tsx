import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch, exportToCSV } from '../utils/api.js';
import { useToast } from './Toast.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign,
  Award, Flame, Zap, Snowflake, CheckCircle2, AlertCircle, Clock, 
  Search, X, Download, User, Edit, History
} from 'lucide-react';

interface InteractionType {
  id: string;
  salesRepName: string;
  status: string;
  candidateFeedback: string;
  updatedAt: string;
}

interface MonthlyLead {
  id: string;
  candidateName: string;
  phoneNumber: string;
  email: string;
  visaStatus: string;
  linkedinUrl: string;
  chatBrief: string;
  jobProfile: string;
  createdByName: string;
  isCold: boolean;
  temperature: 'Cold' | 'Warm' | 'Hot';
  dealValueUsd: number;
  currentStatus: string;
  salesRepName?: string;
  createdAt: string;
  statusUpdatedAt: string;
  interactions?: InteractionType[];
}

interface DashboardMetrics {
  totalRevenueUsd: number;
  totalClosedSales: number;
  conversionRate: number;
  unconvertedActiveLeads: number;
  lostDeals: number;
  noResponseLeads: number;
  totalAssignedLeads: number;
}

interface DashboardDeltas {
  revenueDelta: number;
  closedSalesDelta: number;
  totalLeadsDelta: number;
  conversionRateDelta: number;
}

interface TemperatureTierBreakdown {
  cold: { count: number; pipelineUsd: number; percentage: number };
  warm: { count: number; pipelineUsd: number; percentage: number };
  hot: { count: number; pipelineUsd: number; percentage: number };
}

interface OutcomeBreakdown {
  converted: { count: number; revenueUsd: number; percentage: number };
  inProgress: { count: number; pipelineUsd: number; percentage: number };
  lost: { count: number; lostValueUsd: number; percentage: number };
  noResponse: { count: number; percentage: number };
}

interface MonthlyDashboardResponse {
  monthLabel: string;
  monthCode: string;
  priorMonthLabel: string;
  priorMonthCode: string;
  selectedSalesRep: string;
  availableSalesReps: string[];
  metrics: DashboardMetrics;
  deltas: DashboardDeltas;
  temperatureBreakdown: TemperatureTierBreakdown;
  outcomeBreakdown: OutcomeBreakdown;
  leads: MonthlyLead[];
}

interface Props {
  initialSalesRep?: string;
  canChangeSalesRep?: boolean;
}

export const MonthlyPerformanceDashboard: React.FC<Props> = ({
  initialSalesRep = 'All Representatives',
  canChangeSalesRep = true,
}) => {
  const { toastSuccess, toastError } = useToast();

  const [selectedMonthCode, setSelectedMonthCode] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  });

  const [selectedSalesRep, setSelectedSalesRep] = useState<string>(initialSalesRep);
  const [data, setData] = useState<MonthlyDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [temperatureFilter, setTemperatureFilter] = useState<'ALL' | 'Cold' | 'Warm' | 'Hot'>('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [editingLead, setEditingLead] = useState<MonthlyLead | null>(null);
  const [editTemp, setEditTemp] = useState<'Cold' | 'Warm' | 'Hot'>('Warm');
  const [editVisaStatus, setEditVisaStatus] = useState<string>('Citizen');
  const [editStatus, setEditStatus] = useState<string>('Unconverted (Active)');
  const [editRep, setEditRep] = useState<string>('');
  const [editLoading, setEditLoading] = useState(false);

  const [selectedLeadForHistory, setSelectedLeadForHistory] = useState<MonthlyLead | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const repParam = selectedSalesRep && selectedSalesRep !== 'All Representatives'
        ? `&salesRep=${encodeURIComponent(selectedSalesRep)}`
        : '';
      const res = await apiFetch<MonthlyDashboardResponse>(
        `/api/sales-reps/dashboard?month=${selectedMonthCode}${repParam}`
      );
      setData(res);
    } catch (err: any) {
      toastError(err.message || 'Failed to load monthly performance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonthCode, selectedSalesRep]);

  const handleShiftMonth = (offset: number) => {
    const [m, y] = selectedMonthCode.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1 + offset, 1));
    const newCode = `${String(date.getUTCMonth() + 1).padStart(2, '0')}-${date.getUTCFullYear()}`;
    setSelectedMonthCode(newCode);
  };

  const handleResetToCurrentMonth = () => {
    const d = new Date();
    setSelectedMonthCode(`${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`);
  };

  const handleOpenEdit = (lead: MonthlyLead) => {
    setEditingLead(lead);
    setEditTemp(lead.temperature || (lead.isCold ? 'Cold' : 'Warm'));
    setEditVisaStatus(lead.visaStatus || 'Citizen');
    setEditStatus(lead.currentStatus || 'Unconverted (Active)');
    setEditRep(lead.salesRepName || data?.availableSalesReps[0] || 'Michael Scott');
  };

  const handleSaveLeadMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;

    setEditLoading(true);
    try {
      await apiFetch(`/api/leads/${editingLead.id}/quick-update`, {
        method: 'PUT',
        body: JSON.stringify({
          temperature: editTemp,
          visaStatus: editVisaStatus,
          dealValueUsd: 0,
          currentStatus: editStatus,
          salesRepName: editRep,
        }),
      });

      toastSuccess(`Updated ${editingLead.candidateName}'s deal metrics!`);
      setEditingLead(null);
      fetchDashboardData();
    } catch (err: any) {
      toastError(err.message || 'Failed to update lead');
    } finally {
      setEditLoading(false);
    }
  };

  const filteredLeads = useMemo(() => {
    if (!data?.leads) return [];
    return data.leads.filter((lead) => {
      if (temperatureFilter !== 'ALL' && lead.temperature !== temperatureFilter) {
        return false;
      }
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'Converted' && lead.currentStatus !== 'Converted') return false;
        if (statusFilter === 'Unconverted' && lead.currentStatus !== 'Unconverted (Active)') return false;
        if (statusFilter === 'Lost' && lead.currentStatus !== 'Lost') return false;
        if (statusFilter === 'No Response' && lead.currentStatus !== 'No Response') return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        lead.candidateName.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.phoneNumber.toLowerCase().includes(q) ||
        lead.jobProfile.toLowerCase().includes(q) ||
        lead.visaStatus.toLowerCase().includes(q) ||
        (lead.salesRepName && lead.salesRepName.toLowerCase().includes(q))
      );
    });
  }, [data?.leads, temperatureFilter, statusFilter, searchQuery]);

  const handleExportCSV = () => {
    const rows = filteredLeads.map((l) => ({
      LeadID: l.id,
      CandidateName: l.candidateName,
      JobProfile: l.jobProfile,
      Email: l.email,
      Phone: l.phoneNumber,
      VisaStatus: l.visaStatus || 'Citizen',
      LinkedInUrl: l.linkedinUrl || '',
      CurrentStatus: l.currentStatus,
      AssignedSalesRep: l.salesRepName || 'Unassigned',
      SourcedBy: l.createdByName,
      RegisteredDate: new Date(l.createdAt).toLocaleDateString(),
    }));
    exportToCSV(`sales_performance_${data?.monthCode || selectedMonthCode}`, rows);
    toastSuccess('Performance data exported to CSV!');
  };

  const formatUSD = (val: number = 0) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getTemperatureBadge = (temp: string) => {
    switch (temp) {
      case 'Hot':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg tier-hot">
            <Flame className="h-3 w-3" /> Hot
          </span>
        );
      case 'Warm':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg tier-warm">
            <Zap className="h-3 w-3" /> Warm
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg tier-cold">
            <Snowflake className="h-3 w-3" /> Cold
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Converted':
        return <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg status-converted">Converted (Won)</span>;
      case 'Lost':
        return <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg status-lost">Lost Deal</span>;
      case 'No Response':
        return <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg status-noresponse">No Response</span>;
      default:
        return <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg status-unconverted">In Pipeline (Active)</span>;
    }
  };

  const renderDelta = (delta: number, suffix: string = '%') => {
    if (delta > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="h-3 w-3" /> +{delta}{suffix}
        </span>
      );
    } else if (delta < 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
          <TrendingDown className="h-3 w-3" /> {delta}{suffix}
        </span>
      );
    }
    return <span className="text-[11px] text-slate-400 font-semibold">&bull; 0{suffix}</span>;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Control Bar */}
      <div className="glass-card rounded-3xl p-5 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleShiftMonth(-1)}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-bold text-foreground min-w-[120px] text-center">
              {data?.monthLabel || 'Loading...'}
            </span>
          </div>

          <button
            onClick={() => handleShiftMonth(1)}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs transition-colors"
            title="Next Month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            onClick={handleResetToCurrentMonth}
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline px-2 cursor-pointer border-none bg-transparent"
          >
            Current Month
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {canChangeSalesRep ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" />
              <select
                value={selectedSalesRep}
                onChange={(e) => setSelectedSalesRep(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-foreground glow-input shadow-xs"
              >
                <option value="All Representatives">All Sales Representatives (Company-Wide)</option>
                {data?.availableSalesReps.map((rep) => (
                  <option key={rep} value={rep}>{rep}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-foreground">
              <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>{selectedSalesRep}</span>
            </div>
          )}

          <button
            onClick={handleExportCSV}
            disabled={!data?.leads || data.leads.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            Export CSV
          </button>
        </div>
      </div>

      {/* 2. Top-Level KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card rounded-3xl p-5 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              <span>Total Revenue</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground">
              {formatUSD(data?.metrics.totalRevenueUsd)}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span>vs. {data?.priorMonthLabel.split(' ')[0] || 'Prior'}</span>
            {renderDelta(data?.deltas.revenueDelta || 0)}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card rounded-3xl p-5 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              <span>Deals Won</span>
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Award className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground">
              {data?.metrics.totalClosedSales || 0}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span>vs. {data?.priorMonthLabel.split(' ')[0] || 'Prior'}</span>
            {renderDelta(data?.deltas.closedSalesDelta || 0)}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card rounded-3xl p-5 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              <span>Conversion Rate</span>
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground">
              {data?.metrics.conversionRate || 0}%
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span>vs. {data?.priorMonthLabel.split(' ')[0] || 'Prior'}</span>
            {renderDelta(data?.deltas.conversionRateDelta || 0, '% pts')}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card rounded-3xl p-5 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              <span>Active Pipeline</span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground">
              {data?.metrics.unconvertedActiveLeads || 0}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span>Warm & Hot in progress</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card rounded-3xl p-5 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              <span>Lost Deals</span>
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground">
              {data?.metrics.lostDeals || 0}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span>Disqualified / Declined</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card rounded-3xl p-5 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              <span>No Response</span>
              <div className="p-1.5 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400">
                <Snowflake className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground">
              {data?.metrics.noResponseLeads || 0}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span>0 touchpoint replies</span>
          </div>
        </motion.div>
      </div>

      {/* 3. Visual Pipeline Breakdown & Funnel Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 glass-card rounded-3xl p-6 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Flame className="h-4 w-4 text-rose-500" />
              Lead Temperature Pipeline Tiers
            </h3>
            <span className="text-xs text-slate-400 font-semibold">
              Total: {data?.metrics.totalAssignedLeads || 0} Leads
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 flex overflow-hidden border border-slate-200/80 dark:border-slate-700">
            <div 
              className="bg-rose-500 transition-all duration-500" 
              style={{ width: `${data?.temperatureBreakdown.hot.percentage || 0}%` }}
              title={`Hot Leads: ${data?.temperatureBreakdown.hot.count} (${data?.temperatureBreakdown.hot.percentage}%)`}
            />
            <div 
              className="bg-amber-500 transition-all duration-500" 
              style={{ width: `${data?.temperatureBreakdown.warm.percentage || 0}%` }}
              title={`Warm Leads: ${data?.temperatureBreakdown.warm.count} (${data?.temperatureBreakdown.warm.percentage}%)`}
            />
            <div 
              className="bg-sky-500 transition-all duration-500" 
              style={{ width: `${data?.temperatureBreakdown.cold.percentage || 0}%` }}
              title={`Cold Leads: ${data?.temperatureBreakdown.cold.count} (${data?.temperatureBreakdown.cold.percentage}%)`}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 text-xs">
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold mb-1">
                <Flame className="h-3.5 w-3.5" /> Hot Leads
              </div>
              <div className="text-lg font-black text-foreground">{data?.temperatureBreakdown.hot.count || 0}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {data?.temperatureBreakdown.hot.percentage}% &bull; {formatUSD(data?.temperatureBreakdown.hot.pipelineUsd)}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-xs">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold mb-1">
                <Zap className="h-3.5 w-3.5" /> Warm Leads
              </div>
              <div className="text-lg font-black text-foreground">{data?.temperatureBreakdown.warm.count || 0}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {data?.temperatureBreakdown.warm.percentage}% &bull; {formatUSD(data?.temperatureBreakdown.warm.pipelineUsd)}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/20 text-xs">
              <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-bold mb-1">
                <Snowflake className="h-3.5 w-3.5" /> Cold Leads
              </div>
              <div className="text-lg font-black text-foreground">{data?.temperatureBreakdown.cold.count || 0}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {data?.temperatureBreakdown.cold.percentage}% &bull; {formatUSD(data?.temperatureBreakdown.cold.pipelineUsd)}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 glass-card rounded-3xl p-6 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-500" />
              Monthly Deal Outcome Funnel
            </h3>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {data?.metrics.conversionRate}% Conversion
            </span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Converted (Won Deals)
                </span>
                <span className="text-foreground">
                  {data?.outcomeBreakdown.converted.count} Leads ({formatUSD(data?.outcomeBreakdown.converted.revenueUsd)})
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${data?.outcomeBreakdown.converted.percentage || 0}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> In-Progress (Active Pipeline)
                </span>
                <span className="text-foreground">
                  {data?.outcomeBreakdown.inProgress.count} Leads ({formatUSD(data?.outcomeBreakdown.inProgress.pipelineUsd)})
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${data?.outcomeBreakdown.inProgress.percentage || 0}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Lost / Declined Deals
                </span>
                <span className="text-foreground">
                  {data?.outcomeBreakdown.lost.count} Leads ({formatUSD(data?.outcomeBreakdown.lost.lostValueUsd)})
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${data?.outcomeBreakdown.lost.percentage || 0}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Snowflake className="h-3 w-3" /> Outreach Limit / No Response
                </span>
                <span className="text-foreground">
                  {data?.outcomeBreakdown.noResponse.count} Leads ({data?.outcomeBreakdown.noResponse.percentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-slate-400 h-2 rounded-full" style={{ width: `${data?.outcomeBreakdown.noResponse.percentage || 0}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Filterable Leads Table */}
      <div className="glass-card rounded-3xl p-6 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200 dark:border-slate-700 w-fit text-xs font-bold gap-1">
            {(['ALL', 'Hot', 'Warm', 'Cold'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setTemperatureFilter(tier)}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  temperatureFilter === tier
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {tier === 'ALL' ? 'All Temperatures' : tier}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative min-w-[240px]">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search candidate, job, email, rep..."
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

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input font-bold shadow-xs"
            >
              <option value="ALL">All Outcomes</option>
              <option value="Converted">Converted (Won)</option>
              <option value="Unconverted">In Pipeline (Active)</option>
              <option value="Lost">Lost Deals</option>
              <option value="No Response">No Response</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Candidate Lead</th>
                <th className="py-3 px-4">Temperature</th>
                <th className="py-3 px-4">Visa Status</th>
                <th className="py-3 px-4">Outcome Status</th>
                <th className="py-3 px-4">Assigned Sales Rep</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && !data ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs font-medium">
                    Loading monthly sales performance...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs font-semibold">
                    No leads found matching your criteria in {data?.monthLabel}.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors text-xs">
                    <td className="py-3.5 px-4 font-medium">
                      <div className="font-bold text-foreground">{lead.candidateName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {lead.jobProfile} &bull; <span className="font-bold text-blue-600 dark:text-blue-400">{lead.visaStatus}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getTemperatureBadge(lead.temperature)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {lead.visaStatus || 'Citizen'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(lead.currentStatus)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-semibold">
                      {lead.salesRepName || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(lead.statusUpdatedAt || lead.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(lead)}
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer shadow-xs transition-colors"
                          title="Quick Update Deal Metrics"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedLeadForHistory(lead)}
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 cursor-pointer shadow-xs transition-colors"
                          title="View Call History Logs"
                        >
                          <History className="h-3.5 w-3.5" />
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

      {/* 5. Quick Edit Lead Metrics Modal */}
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
              className="w-full max-w-md glass-card rounded-3xl p-6 relative z-10 border-slate-200 dark:border-slate-800 text-left overflow-y-auto max-h-[90vh] shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <Edit className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-base font-bold text-foreground">Update Deal & Status Metrics</h3>
                </div>
                <button
                  onClick={() => setEditingLead(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-foreground cursor-pointer border-none bg-transparent"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="mb-4 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                <div className="font-bold text-sm text-foreground">{editingLead.candidateName}</div>
                <span className="text-slate-500 dark:text-slate-400">{editingLead.jobProfile} &bull; {editingLead.visaStatus}</span>
              </div>

              <form onSubmit={handleSaveLeadMetrics} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Lead Temperature Tier *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Cold', 'Warm', 'Hot'] as const).map((temp) => (
                      <button
                        key={temp}
                        type="button"
                        onClick={() => setEditTemp(temp)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          editTemp === temp
                            ? temp === 'Hot'
                              ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                              : temp === 'Warm'
                              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                              : 'bg-sky-500 text-white border-sky-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {temp === 'Hot' && <Flame className="h-3.5 w-3.5" />}
                        {temp === 'Warm' && <Zap className="h-3.5 w-3.5" />}
                        {temp === 'Cold' && <Snowflake className="h-3.5 w-3.5" />}
                        {temp}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Visa Status *
                  </label>
                  <select
                    value={editVisaStatus}
                    onChange={(e) => setEditVisaStatus(e.target.value)}
                    className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input font-bold"
                  >
                    <option value="Citizen">Citizen (US/UK/Local)</option>
                    <option value="Green Card">Green Card / PR</option>
                    <option value="H-1B">H-1B Specialty Work</option>
                    <option value="L-1 / L-2">L-1 / L-2 Intra-Company</option>
                    <option value="F-1 OPT">F-1 OPT / Student</option>
                    <option value="TN Visa">TN Visa (NAFTA)</option>
                    <option value="E-3 / Other">E-3 / Other Visa</option>
                    <option value="Work Permit">Work Permit / EAD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Outcome Category *
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input font-bold"
                  >
                    <option value="Converted">Converted (Successfully Closed Won)</option>
                    <option value="Unconverted (Active)">Unconverted (Active in Pipeline)</option>
                    <option value="Lost">Lost (Declined / Competitor)</option>
                    <option value="No Response">No Response (Outreach Limit Reached)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Assigned Sales Professional
                  </label>
                  <input
                    type="text"
                    value={editRep}
                    onChange={(e) => setEditRep(e.target.value)}
                    placeholder="e.g. Michael Scott"
                    className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input"
                  />
                </div>

                <div className="flex gap-3 pt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingLead(null)}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-foreground hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold cursor-pointer shadow-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer border-none shadow-md shadow-blue-600/20"
                  >
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. History Modal */}
      <AnimatePresence>
        {selectedLeadForHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLeadForHistory(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg glass-card rounded-3xl p-6 relative z-10 border-slate-200 dark:border-slate-800 text-left overflow-y-auto max-h-[85vh] text-foreground shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  <h3 className="text-base font-bold">Call History Timeline</h3>
                </div>
                <button
                  onClick={() => setSelectedLeadForHistory(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-foreground cursor-pointer border-none bg-transparent"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="mb-4 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                <div className="font-bold text-sm text-foreground flex items-center gap-2">
                  {selectedLeadForHistory.candidateName}
                  {getTemperatureBadge(selectedLeadForHistory.temperature)}
                </div>
                <span className="text-slate-500 dark:text-slate-400 block mt-0.5">
                  {selectedLeadForHistory.jobProfile} &bull; Visa: {selectedLeadForHistory.visaStatus || 'Citizen'}
                </span>
              </div>

              {selectedLeadForHistory.interactions && selectedLeadForHistory.interactions.length > 0 ? (
                <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200 dark:before:bg-slate-800 max-h-[400px] overflow-y-auto pr-1">
                  {selectedLeadForHistory.interactions.map((log) => (
                    <div key={log.id} className="relative pl-7 flex flex-col gap-1 text-xs">
                      <span className="absolute left-[9px] top-1.5 h-2.5 w-2.5 rounded-full bg-cyan-600 border-2 border-card" />
                      
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-bold text-foreground">{log.salesRepName}</span>
                        <span className="text-[10px] font-bold text-slate-500">
                          {log.status}
                        </span>
                      </div>

                      <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 italic">
                        "{log.candidateFeedback}"
                      </p>

                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {new Date(log.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No interactions updates logged yet for this candidate.
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setSelectedLeadForHistory(null)}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-foreground text-xs font-bold cursor-pointer shadow-xs"
                >
                  Close History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
