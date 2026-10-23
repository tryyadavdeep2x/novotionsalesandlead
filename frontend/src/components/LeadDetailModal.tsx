import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../utils/api.js';
import { useToast } from './Toast.js';
import { useAuth } from '../context/AuthContext.js';
import { ActivityTimeline } from './ActivityTimeline.js';
import { 
  X, Lock, Mail, Phone, ExternalLink, 
  Flame, Zap, Snowflake, UserCheck, Trash2, Edit3, Save, Shield
} from 'lucide-react';

interface LeadDetailModalProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated?: () => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  leadId,
  isOpen,
  onClose,
  onLeadUpdated,
}) => {
  const { user } = useAuth();
  const { toastSuccess, toastError } = useToast();

  const [lead, setLead] = useState<any>(null);
  const [, setLoading] = useState(false);
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable Form Fields (Admin only)
  const [candidateName, setCandidateName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [jobProfile, setJobProfile] = useState('');
  const [visaStatus, setVisaStatus] = useState('Citizen');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [sourcedBy, setSourcedBy] = useState('');
  const [sourcedFrom, setSourcedFrom] = useState('');
  const [attemptedBy, setAttemptedBy] = useState('');
  const [chatBrief, setChatBrief] = useState('');
  const [temperature, setTemperature] = useState<'Hot' | 'Warm' | 'Cold'>('Warm');
  const [salesRepName, setSalesRepName] = useState('');
  const [dealValueUsd, setDealValueUsd] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('No Response');

  const isAdmin = user?.role === 'ADMIN';

  const fetchLeadDetails = async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const data = await apiFetch<any>(`/api/leads/${leadId}`);
      setLead(data);
      setCandidateName(data.candidateName || '');
      setJobTitle(data.jobTitle || data.jobProfile || '');
      setEmail(data.email || '');
      setPhoneNumber(data.phoneNumber || '');
      setJobProfile(data.jobProfile || data.jobTitle || '');
      setVisaStatus(data.visaStatus || 'Citizen');
      setLinkedinUrl(data.linkedInUrl || data.linkedinUrl || '');
      setSourcedBy(data.sourcedBy || data.createdByName || '');
      setSourcedFrom(data.sourcedFrom || '');
      setAttemptedBy(data.attemptedBy || data.salesRepName || '');
      setChatBrief(data.chatBrief || '');
      setTemperature(data.temperature || (data.isCold ? 'Cold' : 'Warm'));
      setSalesRepName(data.salesRepName || data.attemptedBy || '');
      setDealValueUsd(data.dealValueUsd || 0);
      setCurrentStatus(data.currentStatus || 'No Response');
    } catch (err: any) {
      toastError(err.message || 'Failed to load lead details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && leadId) {
      fetchLeadDetails();
      setIsEditingAdmin(false);
    }
  }, [isOpen, leadId]);

  const handleAdminSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !isAdmin) return;

    setSaving(true);
    try {
      await apiFetch(`/api/admin/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify({
          candidateName: candidateName.trim() || undefined,
          jobTitle: jobTitle.trim() || undefined,
          jobProfile: (jobTitle.trim() || jobProfile.trim()) || undefined,
          email: email.trim() || undefined,
          phoneNumber: phoneNumber.trim() || undefined,
          visaStatus: visaStatus.trim() || undefined,
          linkedInUrl: linkedinUrl.trim() || undefined,
          linkedinUrl: linkedinUrl.trim() || undefined,
          sourcedBy: sourcedBy.trim() || undefined,
          sourcedFrom: sourcedFrom.trim() || undefined,
          attemptedBy: attemptedBy.trim() || salesRepName.trim() || undefined,
          chatBrief: chatBrief.trim() || undefined,
          temperature,
          salesRepName: attemptedBy.trim() || salesRepName.trim() || null,
          dealValueUsd: parseFloat(String(dealValueUsd)) || 0,
          currentStatus,
        }),
      });

      toastSuccess('Lead details and assignments saved successfully!');
      setIsEditingAdmin(false);
      fetchLeadDetails();
      if (onLeadUpdated) onLeadUpdated();
    } catch (err: any) {
      toastError(err.message || 'Failed to update lead');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!leadId || !isAdmin) return;
    if (!confirm('Are you sure you want to permanently delete this lead record? This action cannot be undone.')) return;

    try {
      await apiFetch(`/api/admin/leads/${leadId}`, { method: 'DELETE' });
      toastSuccess('Lead deleted successfully.');
      onClose();
      if (onLeadUpdated) onLeadUpdated();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete lead.');
    }
  };

  const getTemperatureBadge = (temp: string) => {
    switch (temp) {
      case 'Hot':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">
            <Flame className="h-3.5 w-3.5" /> Hot Lead (High Intent)
          </span>
        );
      case 'Cold':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">
            <Snowflake className="h-3.5 w-3.5" /> Cold Lead (Uncontacted)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
            <Zap className="h-3.5 w-3.5" /> Warm Lead (In Discussion)
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          className="w-full max-w-5xl glass-card rounded-3xl p-6 relative z-10 border-slate-200 dark:border-slate-800 shadow-2xl text-foreground text-left max-h-[90vh] flex flex-col"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-extrabold text-base">
                {lead?.candidateName ? lead.candidateName.charAt(0).toUpperCase() : 'L'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-foreground">{lead?.candidateName || 'Lead Profile'}</h2>
                  {lead && getTemperatureBadge(lead.temperature || (lead.isCold ? 'Cold' : 'Warm'))}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Registered by <strong className="text-slate-300">{lead?.createdByName}</strong> on {lead?.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && !isEditingAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditingAdmin(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 text-xs font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Admin Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-colors cursor-pointer border border-rose-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </>
              )}

              {isAdmin && isEditingAdmin && (
                <button
                  type="button"
                  onClick={() => setIsEditingAdmin(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  Cancel Edit
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 flex-1 overflow-y-auto pr-1">
            {/* Left Column: Lead Demographics & Assignments */}
            <div className="lg:col-span-5 space-y-4">
              {!isAdmin ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
                  <Lock className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Standard profile fields are locked in read-only mode for non-admin roles.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold">
                  <Shield className="h-4 w-4 shrink-0" />
                  <span>Executive Administrator Privileges Active</span>
                </div>
              )}

              {isEditingAdmin ? (
                /* Admin Edit Form */
                <form onSubmit={handleAdminSave} noValidate className="space-y-3 bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Candidate Full Name</label>
                      <input
                        type="text"
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-foreground font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Job Title / Designation</label>
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-foreground"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Email Address</label>
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-foreground"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Sourced From (Origin)</label>
                      <input
                        type="text"
                        value={sourcedFrom}
                        onChange={(e) => setSourcedFrom(e.target.value)}
                        placeholder="e.g. LinkedIn, GitHub, Referral"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Sourced By (Team Member)</label>
                      <input
                        type="text"
                        value={sourcedBy}
                        onChange={(e) => setSourcedBy(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-foreground"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Priority Temperature</label>
                      <select
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value as any)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-foreground"
                      >
                        <option value="Hot">🔥 Hot Lead</option>
                        <option value="Warm">⚡ Warm Lead</option>
                        <option value="Cold">❄️ Cold Lead</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Attempted By (Sales Rep)</label>
                      <input
                        type="text"
                        value={attemptedBy || salesRepName}
                        onChange={(e) => {
                          setAttemptedBy(e.target.value);
                          setSalesRepName(e.target.value);
                        }}
                        placeholder="Assigned sales member"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-foreground"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Visa Status</label>
                      <select
                        value={visaStatus}
                        onChange={(e) => setVisaStatus(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-foreground"
                      >
                        <option value="">Not Specified</option>
                        <option value="US Citizen">US Citizen</option>
                        <option value="Citizen">Citizen (Local)</option>
                        <option value="Green Card">Green Card / PR</option>
                        <option value="H-1B">H-1B Specialty Work</option>
                        <option value="OPT/CPT">OPT / CPT Student</option>
                        <option value="L-1 / L-2">L-1 / L-2 Intra-Company</option>
                        <option value="TN Visa">TN Visa (NAFTA)</option>
                        <option value="Work Permit">Work Permit / EAD</option>
                        <option value="Other">Other Visa</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">LinkedIn Profile URL</label>
                      <input
                        type="text"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-foreground"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Chat Brief & Screening Notes</label>
                    <textarea
                      rows={3}
                      value={chatBrief}
                      onChange={(e) => setChatBrief(e.target.value)}
                      placeholder="Initial discussion screening notes..."
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-foreground resize-y"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md cursor-pointer border-none"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {saving ? 'Saving Changes...' : 'Save Lead Information'}
                    </button>
                  </div>
                </form>
              ) : (
                /* Read-Only Profile Card */
                <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3.5 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Contact Information</span>
                    <div className="font-extrabold text-sm text-foreground">{lead?.candidateName || 'Unnamed Lead'}</div>
                    <div className="flex flex-col gap-1 mt-1 text-slate-600 dark:text-slate-300">
                      {lead?.email ? (
                        <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                          <Mail className="h-3.5 w-3.5 text-blue-500" />
                          <span>{lead.email}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">No email provided</span>
                      )}
                      {lead?.phoneNumber && (
                        <a href={`tel:${lead.phoneNumber}`} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                          <Phone className="h-3.5 w-3.5 text-emerald-500" />
                          <span>{lead.phoneNumber}</span>
                        </a>
                      )}
                      {(lead?.linkedInUrl || lead?.linkedinUrl) && (
                        <a href={lead.linkedInUrl || lead.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:underline">
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>LinkedIn Profile</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Designation / Role</span>
                      <span className="font-bold text-foreground">{lead?.jobTitle || lead?.jobProfile || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Visa Status</span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 inline-block">
                        {lead?.visaStatus || 'Not Specified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Attempted By</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <UserCheck className="h-3.5 w-3.5" />
                        {lead?.attemptedBy || lead?.salesRepName || 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Sourcing Origin</span>
                      <span className="font-semibold text-foreground">
                        {lead?.sourcedFrom || 'Not Specified'} {lead?.sourcedBy ? `(by ${lead.sourcedBy})` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Operational Status</span>
                      <span className="font-extrabold text-foreground">{lead?.currentStatus || 'No Response'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Priority Tier</span>
                    {lead && getTemperatureBadge(lead.temperature || (lead.isCold ? 'Cold' : 'Warm'))}
                  </div>

                  {lead?.chatBrief && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Chat Brief & Screening Notes</span>
                      <p className="text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 whitespace-pre-line">
                        "{lead.chatBrief}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Activity Timeline & Interaction Comment Stream */}
            <div className="lg:col-span-7 flex flex-col h-[520px]">
              {lead && (
                <ActivityTimeline
                  leadId={lead.id}
                  currentStatus={lead.currentStatus}
                  onStatusUpdated={(st) => {
                    setCurrentStatus(st);
                    if (onLeadUpdated) onLeadUpdated();
                  }}
                />
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
