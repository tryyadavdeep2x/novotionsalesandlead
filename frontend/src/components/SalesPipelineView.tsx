import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch, exportToCSV } from '../utils/api.js';
import { useToast } from './Toast.js';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.js';
import { LeadDetailModal } from './LeadDetailModal.js';
import { BatchAllocateModal } from './BatchAllocateModal.js';
import { 
  Briefcase, Plus, Search, X, Download, Edit, Trash2,
  MessageSquare, Flame, Zap, Snowflake, Linkedin
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
}

export const SalesPipelineView: React.FC = () => {
  const { user } = useAuth();
  const { toastSuccess, toastError } = useToast();
  const [leads, setLeads] = useState<LeadType[]>([]);
  const [loading, setLoading] = useState(true);

  const [stageFilter, setStageFilter] = useState<'ALL' | 'New' | 'Contacted' | 'Proposal Sent' | 'Won' | 'Lost'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isBatchAllocateOpen, setIsBatchAllocateOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadType | null>(null);

  // Form state
  const [leadName, setLeadName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState<'New' | 'Contacted' | 'Proposal Sent' | 'Won' | 'Lost'>('New');
  const [temperature, setTemperature] = useState<'Hot' | 'Warm' | 'Cold'>('Warm');
  const [visaStatus, setVisaStatus] = useState('Citizen');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [repName, setRepName] = useState(user?.identifier || 'Michael Scott');
  const [notes, setNotes] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<LeadType[]>('/api/leads');
      setLeads(data);
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch sales leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleOpenDetail = (id: string) => {
    setSelectedLeadId(id);
    setIsDetailOpen(true);
  };

  const handleQuickStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await apiFetch(`/api/leads/${leadId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: newStatus,
          commentNotes: `Quick status changed to "${newStatus}"`,
          salesRepName: user?.identifier || 'Sales Specialist',
        }),
      });
      toastSuccess(`Lead status updated to "${newStatus}"`);
      fetchLeads();
    } catch (err: any) {
      toastError(err.message || 'Failed to update status');
    }
  };

  const handleOpenCreate = () => {
    setLeadName('');
    setEmail('');
    setPhone('');
    setStage('New');
    setTemperature('Warm');
    setVisaStatus('Citizen');
    setLinkedinUrl('');
    setFollowUpDate('');
    setRepName(user?.identifier || 'Michael Scott');
    setNotes('');
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (lead: LeadType) => {
    setEditingLead(lead);
    setLeadName(lead.candidateName);
    setEmail(lead.email);
    setPhone(lead.phoneNumber);
    setStage(lead.stage || 'New');
    setTemperature(lead.temperature || (lead.isCold ? 'Cold' : 'Warm'));
    setVisaStatus(lead.visaStatus || 'Citizen');
    setLinkedinUrl(lead.linkedinUrl || '');
    setFollowUpDate(lead.nextFollowUpDate ? lead.nextFollowUpDate.split('T')[0] : '');
    setRepName(lead.salesRepName || 'Michael Scott');
    setNotes(lead.chatBrief || '');
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormLoading(true);
    try {
      if (editingLead && isAdmin) {
        await apiFetch(`/api/admin/leads/${editingLead.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            candidateName: leadName.trim() || undefined,
            email: email.trim() || undefined,
            phoneNumber: phone.trim() || undefined,
            stage,
            temperature,
            visaStatus: visaStatus.trim() || undefined,
            linkedInUrl: linkedinUrl.trim() || undefined,
            linkedinUrl: linkedinUrl.trim() || undefined,
            dealValueUsd: 0,
            salesRepName: repName.trim() || undefined,
            attemptedBy: repName.trim() || undefined,
            nextFollowUpDate: followUpDate ? new Date(followUpDate) : null,
            chatBrief: notes.trim() || undefined,
            currentStatus: stage === 'Won' ? 'Converted' : stage === 'Lost' ? 'Lost' : 'Interested',
          }),
        });
        toastSuccess(`Updated deal for ${leadName.trim() || 'lead'}`);
        setEditingLead(null);
      } else {
        await apiFetch('/api/leads', {
          method: 'POST',
          body: JSON.stringify({
            candidateName: leadName.trim() || undefined,
            email: email.trim() || undefined,
            phoneNumber: phone.trim() || undefined,
            visaStatus: visaStatus.trim() || undefined,
            linkedInUrl: linkedinUrl.trim() || undefined,
            linkedinUrl: linkedinUrl.trim() || undefined,
            chatBrief: notes.trim() || undefined,
            jobProfile: 'Sales Opportunity',
            jobTitle: 'Sales Opportunity',
            createdByName: user?.identifier || repName.trim() || 'Sales Specialist',
            sourcedBy: user?.identifier || repName.trim() || 'Sales Specialist',
            salesRepName: repName.trim() || undefined,
            attemptedBy: repName.trim() || undefined,
            temperature,
            dealValueUsd: 0,
            nextFollowUpDate: followUpDate ? new Date(followUpDate) : null,
          }),
        });
        toastSuccess(`Lead ${leadName.trim() || 'New Lead'} created successfully!`);
        setIsCreateOpen(false);
      }
      fetchLeads();
    } catch (err: any) {
      toastError(err.message || 'Failed to save lead');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm('Are you sure you want to delete this sales lead?')) return;
    try {
      await apiFetch(`/api/admin/leads/${id}`, { method: 'DELETE' });
      toastSuccess('Lead deleted');
      fetchLeads();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete lead');
    }
  };

  const getTemperatureBadge = (temp: string = 'Warm') => {
    switch (temp) {
      case 'Hot':
        return (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <Flame className="h-3 w-3" /> Hot
          </span>
        );
      case 'Cold':
        return (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Snowflake className="h-3 w-3" /> Cold
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Zap className="h-3 w-3" /> Warm
          </span>
        );
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (stageFilter !== 'ALL' && l.stage !== stageFilter) return false;
      if (statusFilter !== 'ALL' && l.currentStatus !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        l.candidateName.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.salesRepName && l.salesRepName.toLowerCase().includes(q)) ||
        (l.jobProfile && l.jobProfile.toLowerCase().includes(q)) ||
        (l.currentStatus && l.currentStatus.toLowerCase().includes(q))
      );
    });
  }, [leads, stageFilter, statusFilter, searchQuery]);

  const handleExport = () => {
    const data = filteredLeads.map((l) => ({
      CandidateName: l.candidateName,
      Email: l.email,
      Phone: l.phoneNumber,
      Stage: l.stage,
      Temperature: l.temperature || (l.isCold ? 'Cold' : 'Warm'),
      OperationalStatus: l.currentStatus || 'No Response',
      VisaStatus: l.visaStatus || 'Citizen',
      LinkedInUrl: l.linkedinUrl || '',
      SalesRep: l.salesRepName || 'Unassigned',
      NextFollowUp: l.nextFollowUpDate ? new Date(l.nextFollowUpDate).toLocaleDateString() : 'N/A',
      Notes: l.chatBrief,
      CreatedAt: new Date(l.createdAt).toLocaleDateString(),
    }));
    exportToCSV('sales_pipeline_leads', data);
    toastSuccess('Sales leads exported to CSV!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card rounded-3xl p-5 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Active Sales Pipeline & Deal Tracker
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Operational pipeline tracking with RBAC, realtime status management, and activity timeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Filtered Leads</span>
            <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
              {filteredLeads.length} Leads
            </span>
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsBatchAllocateOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-xs font-bold transition-all cursor-pointer border-none shadow-md shadow-blue-600/20"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Auto-Distribute 20 Leads</span>
            </button>
          )}

          <button
            onClick={handleExport}
            disabled={filteredLeads.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            Export CSV
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer border-none shadow-md shadow-blue-600/20"
          >
            <Plus className="h-4 w-4" />
            New Sales Lead
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-3xl p-5 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200 dark:border-slate-700 text-xs font-bold gap-1">
            {(['ALL', 'New', 'Contacted', 'Proposal Sent', 'Won', 'Lost'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStageFilter(st)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  stageFilter === st
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                {st === 'ALL' ? 'All Stages' : st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Interested">Interested</option>
              <option value="Maybe Interested">Maybe Interested</option>
              <option value="No Response">No Response</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Converted">Converted</option>
            </select>

            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search candidate, rep, profile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-foreground glow-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-3 px-3">Lead & Profile</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Operational Status</th>
                <th className="py-3 px-3">Assigned Rep</th>
                <th className="py-3 px-3">Visa Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading sales pipeline leads...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No leads matching current filters.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-3">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(lead.id)}
                        className="text-left font-bold text-foreground hover:text-blue-600 transition-colors cursor-pointer border-none bg-transparent p-0 block"
                      >
                        {lead.candidateName}
                      </button>
                      <span className="text-[11px] text-slate-400 block mt-0.5 font-normal">
                        {lead.jobProfile || 'Opportunity'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="text-slate-600 dark:text-slate-300 font-semibold">{lead.email}</div>
                      <div className="flex items-center gap-2 text-slate-400 text-[10px] mt-0.5">
                        <span>{lead.phoneNumber}</span>
                        {lead.linkedinUrl && lead.linkedinUrl !== 'https://linkedin.com' && (
                          <a
                            href={lead.linkedinUrl.startsWith('http') ? lead.linkedinUrl : `https://${lead.linkedinUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-700"
                            title="Open LinkedIn Profile"
                          >
                            <Linkedin className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      {getTemperatureBadge(lead.temperature || (lead.isCold ? 'Cold' : 'Warm'))}
                    </td>

                    <td className="py-3.5 px-3">
                      {/* Real-time Quick-select Operational Status Dropdown */}
                      <select
                        value={lead.currentStatus || 'No Response'}
                        onChange={(e) => handleQuickStatusChange(lead.id, e.target.value)}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="Interested">Interested</option>
                        <option value="Maybe Interested">Maybe Interested</option>
                        <option value="No Response">No Response</option>
                        <option value="Not Interested">Not Interested</option>
                        <option value="Converted">Converted</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-3 font-semibold text-slate-700 dark:text-slate-200">
                      {lead.salesRepName || 'Unassigned'}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {lead.visaStatus || 'Citizen'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(lead.id)}
                          className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors cursor-pointer border-none"
                          title="View Timeline & Details"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>

                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(lead)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-foreground transition-colors cursor-pointer border-none bg-transparent"
                              title="Edit Lead"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLead(lead.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 hover:text-rose-600 transition-colors cursor-pointer border-none bg-transparent"
                              title="Delete Lead"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unified Lead Detail & Activity Timeline Modal */}
      <BatchAllocateModal
        isOpen={isBatchAllocateOpen}
        onClose={() => setIsBatchAllocateOpen(false)}
        onAllocated={fetchLeads}
      />

      <LeadDetailModal
        leadId={selectedLeadId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedLeadId(null);
        }}
        onLeadUpdated={fetchLeads}
      />

      {/* Admin Quick Create/Edit Modal */}
      <AnimatePresence>
        {(isCreateOpen || editingLead) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsCreateOpen(false); setEditingLead(null); }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg glass-card rounded-3xl p-6 relative z-10 border-slate-200 dark:border-slate-800 shadow-2xl text-foreground text-left max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                <h3 className="text-base font-bold text-foreground">
                  {editingLead ? 'Edit Pre-Sales Lead' : 'Register New Pre-Sales Lead'}
                </h3>
                <button
                  onClick={() => { setIsCreateOpen(false); setEditingLead(null); }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleSaveLead} noValidate className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Lead / Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Dynamics Corp"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Primary Contact Email
                    </label>
                    <input
                      type="text"
                      placeholder="contact@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Pipeline Stage
                    </label>
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value as any)}
                      className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input font-bold"
                    >
                      <option value="New">New Lead</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Proposal Sent">Proposal Sent</option>
                      <option value="Won">Won Deal</option>
                      <option value="Lost">Lost Deal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Priority Tier
                    </label>
                    <select
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value as any)}
                      className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input font-bold"
                    >
                      <option value="Hot">🔥 Hot Lead</option>
                      <option value="Warm">⚡ Warm Lead</option>
                      <option value="Cold">❄️ Cold Lead</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Visa Status
                    </label>
                    <select
                      value={visaStatus}
                      onChange={(e) => setVisaStatus(e.target.value)}
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
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <Linkedin className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      LinkedIn Profile URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://linkedin.com/in/username"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Assigned Sales Rep
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Michael Scott"
                      value={repName}
                      onChange={(e) => setRepName(e.target.value)}
                      className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Next Follow-Up Date
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Quick Notes & Deal Brief
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter key requirements, deal terms, or next steps..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsCreateOpen(false); setEditingLead(null); }}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer border-none shadow-md shadow-blue-600/20"
                  >
                    {formLoading ? 'Saving...' : editingLead ? 'Update Deal' : 'Save Sales Lead'}
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
