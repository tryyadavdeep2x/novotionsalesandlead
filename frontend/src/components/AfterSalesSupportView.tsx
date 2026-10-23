import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch, exportToCSV } from '../utils/api.js';
import { useToast } from './Toast.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LifeBuoy, Plus, Search, X, Download, Edit, Calendar, Trash2, MessageSquare
} from 'lucide-react';

interface SupportTicket {
  id: string;
  clientName: string;
  contactPerson: string;
  email: string;
  phone: string;
  accountStatus: 'Onboarding' | 'Active' | 'In Support' | 'Renewal Due';
  ticketSubject: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  assignedAgent: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  resolutionDate?: string;
  activityLogs: string;
  createdAt: string;
}

export const AfterSalesSupportView: React.FC = () => {
  const { toastSuccess, toastError } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<SupportTicket | null>(null);
  const [viewingTicket, setViewingTicket] = useState<SupportTicket | null>(null);

  const [clientName, setClientName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [accountStatus, setAccountStatus] = useState<'Onboarding' | 'Active' | 'In Support' | 'Renewal Due'>('Active');
  const [ticketSubject, setTicketSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [assignedAgent, setAssignedAgent] = useState('David Chen (DevOps Support)');
  const [ticketStatus, setTicketStatus] = useState<'Open' | 'In Progress' | 'Resolved' | 'Closed'>('Open');
  const [resolutionDate, setResolutionDate] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<SupportTicket[]>('/api/support');
      setTickets(data);
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch support tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleOpenCreate = () => {
    setClientName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setAccountStatus('Active');
    setTicketSubject('');
    setDescription('');
    setPriority('Medium');
    setAssignedAgent('David Chen (DevOps Support)');
    setTicketStatus('Open');
    setResolutionDate('');
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (ticket: SupportTicket) => {
    setEditingTicket(ticket);
    setClientName(ticket.clientName);
    setContactPerson(ticket.contactPerson);
    setEmail(ticket.email);
    setPhone(ticket.phone);
    setAccountStatus(ticket.accountStatus);
    setTicketSubject(ticket.ticketSubject);
    setDescription(ticket.description);
    setPriority(ticket.priority);
    setAssignedAgent(ticket.assignedAgent);
    setTicketStatus(ticket.status);
    setResolutionDate(ticket.resolutionDate ? ticket.resolutionDate.split('T')[0] : '');
  };

  const handleSaveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !contactPerson.trim() || !email.trim() || !ticketSubject.trim() || !description.trim()) {
      return;
    }

    setFormLoading(true);
    try {
      if (editingTicket) {
        await apiFetch(`/api/support/${editingTicket.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            clientName: clientName.trim(),
            contactPerson: contactPerson.trim(),
            email: email.trim(),
            phone: phone.trim(),
            accountStatus,
            ticketSubject: ticketSubject.trim(),
            description: description.trim(),
            priority,
            assignedAgent: assignedAgent.trim(),
            status: ticketStatus,
            resolutionDate: resolutionDate ? new Date(resolutionDate) : null,
          }),
        });
        toastSuccess(`Updated support ticket for ${clientName.trim()}`);
        setEditingTicket(null);
      } else {
        await apiFetch('/api/support', {
          method: 'POST',
          body: JSON.stringify({
            clientName: clientName.trim(),
            contactPerson: contactPerson.trim(),
            email: email.trim(),
            phone: phone.trim(),
            accountStatus,
            ticketSubject: ticketSubject.trim(),
            description: description.trim(),
            priority,
            assignedAgent: assignedAgent.trim(),
            resolutionDate: resolutionDate ? new Date(resolutionDate) : null,
          }),
        });
        toastSuccess(`Service request logged for ${clientName.trim()}`);
        setIsCreateOpen(false);
      }
      fetchTickets();
    } catch (err: any) {
      toastError(err.message || 'Failed to save support ticket');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTicket = async (id: string) => {
    if (!confirm('Are you sure you want to delete this support request?')) return;
    try {
      await apiFetch(`/api/support/${id}`, { method: 'DELETE' });
      toastSuccess('Support ticket deleted');
      fetchTickets();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete ticket');
    }
  };

  const getAccountStatusBadge = (st: string) => {
    switch (st) {
      case 'Active':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">Active Client</span>;
      case 'Onboarding':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">Onboarding</span>;
      case 'Renewal Due':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">Renewal Due</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25">In Support</span>;
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'High':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">High Priority</span>;
      case 'Low':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">Low Priority</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">Medium</span>;
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== 'ALL' && t.accountStatus !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.clientName.toLowerCase().includes(q) ||
        t.contactPerson.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.ticketSubject.toLowerCase().includes(q) ||
        t.assignedAgent.toLowerCase().includes(q)
      );
    });
  }, [tickets, statusFilter, priorityFilter, searchQuery]);

  const handleExport = () => {
    const data = filteredTickets.map((t) => ({
      ClientName: t.clientName,
      ContactPerson: t.contactPerson,
      Email: t.email,
      Phone: t.phone,
      AccountStatus: t.accountStatus,
      TicketSubject: t.ticketSubject,
      Priority: t.priority,
      Status: t.status,
      AssignedEngineer: t.assignedAgent,
      ResolutionTargetDate: t.resolutionDate ? new Date(t.resolutionDate).toLocaleDateString() : 'N/A',
      Description: t.description,
      LoggedDate: new Date(t.createdAt).toLocaleDateString(),
    }));
    exportToCSV('after_sales_support_records', data);
    toastSuccess('Support tickets exported to CSV!');
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-3xl p-5 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            After-Sales & Client Support Operations
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Operational client management, service requests, onboarding SLAs (Zero financial deal metrics).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={filteredTickets.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
            Export CSV
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-colors cursor-pointer border-none shadow-md shadow-cyan-600/20"
          >
            <Plus className="h-4 w-4" />
            New Support Ticket
          </button>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-5 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200 dark:border-slate-700 text-xs font-bold gap-1">
            {(['ALL', 'Onboarding', 'Active', 'In Support', 'Renewal Due'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Accounts' : st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input font-bold shadow-xs"
            >
              <option value="ALL">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <div className="relative min-w-[240px]">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search client, subject, engineer..."
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
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Client & Subject</th>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Assigned Engineer</th>
                <th className="py-3 px-4">Target Resolution</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Loading support tickets...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs font-semibold">
                    No support tickets found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors text-xs">
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      {t.clientName}
                      <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold line-clamp-1 mt-0.5">{t.ticketSubject}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 dark:text-slate-300 font-medium">{t.contactPerson}</div>
                      <div className="text-[11px] text-slate-400">{t.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getAccountStatusBadge(t.accountStatus)}
                    </td>
                    <td className="py-3.5 px-4">
                      {getPriorityBadge(t.priority)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-foreground/90">
                      {t.assignedAgent}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      {t.resolutionDate ? (
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <Calendar className="h-3 w-3 text-cyan-600" />
                          {new Date(t.resolutionDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Open SLA</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingTicket(t)}
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 cursor-pointer shadow-xs"
                          title="View Details & Logs"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer shadow-xs"
                          title="Edit Ticket"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTicket(t.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/25 text-rose-600 dark:text-rose-400 cursor-pointer transition-colors shadow-xs"
                          title="Delete Ticket"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      <AnimatePresence>
        {(isCreateOpen || editingTicket) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsCreateOpen(false); setEditingTicket(null); }}
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
                  {editingTicket ? 'Edit Support Service Request' : 'Log New Support Request'}
                </h3>
                <button
                  onClick={() => { setIsCreateOpen(false); setEditingTicket(null); }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleSaveTicket} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Client / Company Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Health Systems"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Rebecca Stern"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      placeholder="rstern@apexhealth.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input"
                      required
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Account Status *
                    </label>
                    <select
                      value={accountStatus}
                      onChange={(e) => setAccountStatus(e.target.value as any)}
                      className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input font-bold"
                    >
                      <option value="Onboarding">Onboarding</option>
                      <option value="Active">Active</option>
                      <option value="In Support">In Support</option>
                      <option value="Renewal Due">Renewal Due</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Priority Level *
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input font-bold"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High Priority</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Ticket Subject *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SSL Certificate Rotation & SAML Verification"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Assigned Engineer / Agent
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. David Chen (DevOps)"
                      value={assignedAgent}
                      onChange={(e) => setAssignedAgent(e.target.value)}
                      className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Target Resolution Date
                    </label>
                    <input
                      type="date"
                      value={resolutionDate}
                      onChange={(e) => setResolutionDate(e.target.value)}
                      className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Service Request Description *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide full technical details, logs, or customer request specifics..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-field border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-foreground text-xs glow-input resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsCreateOpen(false); setEditingTicket(null); }}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-colors cursor-pointer border-none shadow-md shadow-cyan-600/20"
                  >
                    {formLoading ? 'Saving...' : editingTicket ? 'Update Ticket' : 'Save Support Ticket'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingTicket(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md glass-card rounded-3xl p-6 relative z-10 border-slate-200 dark:border-slate-800 shadow-2xl text-foreground text-left max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <LifeBuoy className="h-5 w-5 text-cyan-600" />
                  <h3 className="text-base font-bold text-foreground">Support Request Details</h3>
                </div>
                <button
                  onClick={() => setViewingTicket(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="font-extrabold text-sm text-foreground">{viewingTicket.clientName}</div>
                  <span className="text-slate-400 mt-0.5 block">{viewingTicket.contactPerson} &bull; {viewingTicket.email}</span>
                  <div className="flex items-center gap-2 mt-2">
                    {getAccountStatusBadge(viewingTicket.accountStatus)}
                    {getPriorityBadge(viewingTicket.priority)}
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Subject
                  </span>
                  <p className="font-bold text-foreground bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    {viewingTicket.ticketSubject}
                  </p>
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Description
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
                    {viewingTicket.description}
                  </p>
                </div>

                {viewingTicket.activityLogs && (
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Activity Logs
                    </span>
                    <p className="text-slate-500 italic bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      "{viewingTicket.activityLogs}"
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setViewingTicket(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-foreground text-xs font-bold cursor-pointer border-none"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
