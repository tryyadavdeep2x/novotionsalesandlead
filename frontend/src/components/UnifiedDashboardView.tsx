import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api.js';
import { useToast } from './Toast.js';
import { 
  Briefcase, Users, Calendar, ArrowRight, 
  CheckCircle2, ArrowUpRight, Target
} from 'lucide-react';

interface UnifiedDashboardData {
  sales: {
    totalLeads: number;
    newLeads: number;
    contactedLeads: number;
    proposalLeads: number;
    wonDeals: number;
    lostDeals: number;
    pendingFollowUps: number;
    totalPipelineRevenue: number;
    wonRevenue: number;
    recentLeads: Array<{
      id: string;
      candidateName: string;
      email: string;
      stage: string;
      dealValueUsd?: number;
      visaStatus?: string;
      salesRepName?: string;
      nextFollowUpDate?: string;
    }>;
  };
}

interface Props {
  onNavigateToSales: () => void;
}

export const UnifiedDashboardView: React.FC<Props> = ({
  onNavigateToSales,
}) => {
  const { toastError } = useToast();
  const [data, setData] = useState<UnifiedDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<UnifiedDashboardData>('/api/crm/unified-dashboard');
      setData(res);
    } catch (err: any) {
      toastError(err.message || 'Failed to load CRM metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs">
        <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading Sales Command Center...
      </div>
    );
  }

  const totalSalesLeads = data?.sales.totalLeads || 1;
  const newLeads = data?.sales.newLeads || 0;
  const contactedLeads = data?.sales.contactedLeads || 0;
  const proposalLeads = data?.sales.proposalLeads || 0;
  const wonDeals = data?.sales.wonDeals || 0;
  const lostDeals = data?.sales.lostDeals || 0;
  const winRate = totalSalesLeads > 0 ? ((wonDeals / totalSalesLeads) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border-slate-200/80 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Pre-Sales Leads
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {data?.sales.totalLeads || 0}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            Registered candidate pipeline
          </span>
        </div>

        <div className="glass-card rounded-2xl p-5 border-slate-200/80 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Converted Deals
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {data?.sales.wonDeals || 0}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            Successfully closed opportunities
          </span>
        </div>

        <div className="glass-card rounded-2xl p-5 border-slate-200/80 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pipeline Win Rate
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {winRate}%
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            {wonDeals} of {totalSalesLeads} leads converted
          </span>
        </div>

        <div className="glass-card rounded-2xl p-5 border-slate-200/80 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pending Follow-Ups
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {data?.sales.pendingFollowUps || 0}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            Scheduled client interactions
          </span>
        </div>
      </div>

      {/* Main Grid: Pipeline Breakdown & Recent Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Pipeline Stages & Funnel */}
        <div className="lg:col-span-7 glass-card rounded-2xl p-6 border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-6 bg-white dark:bg-slate-900">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                  <Briefcase className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Pipeline Stage Distribution</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Stage velocity and opportunity breakdown</p>
                </div>
              </div>

              <span className="text-xs text-slate-400 font-medium">
                {totalSalesLeads} Active Leads
              </span>
            </div>

            {/* Visual Pipeline Bar */}
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Funnel Progress</span>
                <span className="text-slate-400">{wonDeals} Won &bull; {lostDeals} Lost</span>
              </div>

              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                {newLeads > 0 && (
                  <div 
                    style={{ width: `${(newLeads / totalSalesLeads) * 100}%` }} 
                    className="bg-blue-500 rounded-xs transition-all duration-500" 
                    title={`New: ${newLeads}`}
                  />
                )}
                {contactedLeads > 0 && (
                  <div 
                    style={{ width: `${(contactedLeads / totalSalesLeads) * 100}%` }} 
                    className="bg-indigo-500 rounded-xs transition-all duration-500" 
                    title={`Contacted: ${contactedLeads}`}
                  />
                )}
                {proposalLeads > 0 && (
                  <div 
                    style={{ width: `${(proposalLeads / totalSalesLeads) * 100}%` }} 
                    className="bg-purple-500 rounded-xs transition-all duration-500" 
                    title={`Proposal Sent: ${proposalLeads}`}
                  />
                )}
                {wonDeals > 0 && (
                  <div 
                    style={{ width: `${(wonDeals / totalSalesLeads) * 100}%` }} 
                    className="bg-emerald-500 rounded-xs transition-all duration-500" 
                    title={`Won: ${wonDeals}`}
                  />
                )}
                {lostDeals > 0 && (
                  <div 
                    style={{ width: `${(lostDeals / totalSalesLeads) * 100}%` }} 
                    className="bg-rose-400 rounded-xs transition-all duration-500" 
                    title={`Lost: ${lostDeals}`}
                  />
                )}
              </div>

              {/* Stage Detail Cards */}
              <div className="grid grid-cols-5 gap-2 text-center pt-2">
                <div className="py-2.5 px-1 rounded-xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800/50">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{newLeads}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">New</span>
                </div>
                <div className="py-2.5 px-1 rounded-xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800/50">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{contactedLeads}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Contacted</span>
                </div>
                <div className="py-2.5 px-1 rounded-xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800/50">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{proposalLeads}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Proposal</span>
                </div>
                <div className="py-2.5 px-1 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{wonDeals}</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Won</span>
                </div>
                <div className="py-2.5 px-1 rounded-xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{lostDeals}</span>
                  </div>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">Lost</span>
                </div>
              </div>
            </div>

            {/* Scheduled Follow-ups Notification Bar */}
            <div className="mt-5 p-3 rounded-xl bg-amber-500/8 dark:bg-amber-950/25 border border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 font-medium">
                <Calendar className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>Follow-Up Outreach Required</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold text-[11px] border border-amber-500/25">
                {data?.sales.pendingFollowUps || 0} Leads Due
              </span>
            </div>
          </div>

          <button
            onClick={onNavigateToSales}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors cursor-pointer border-none flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Manage Full Sales Pipeline & Deals</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-80" />
          </button>
        </div>

        {/* Right Column: Recent Pipeline Leads */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-6 border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-5 bg-white dark:bg-slate-900">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Recent Opportunities</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Latest pre-sales entries & assignments</p>
              </div>

              <button
                onClick={onNavigateToSales}
                className="group flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer border-none bg-transparent transition-colors"
              >
                <span>View All</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {data?.sales.recentLeads && data.sales.recentLeads.length > 0 ? (
                data.sales.recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={onNavigateToSales}
                    className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 hover:border-blue-500/40 cursor-pointer transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        {lead.candidateName}
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                          lead.stage === 'Won' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : lead.stage === 'Lost'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        }`}>
                          {lead.stage}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        {lead.salesRepName || 'Unassigned'} &bull; {lead.email}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {lead.visaStatus || 'Citizen'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No active opportunities recorded yet.
                </div>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Enterprise Deal Tracking & RBAC Security</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">Live Sync</span>
          </div>
        </div>

      </div>
    </div>
  );
};
