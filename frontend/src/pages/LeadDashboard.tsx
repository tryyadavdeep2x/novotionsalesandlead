import React, { useState } from 'react';
import { NovotionLogo } from '../components/NovotionLogo.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../components/Toast.js';
import { LeadProfessionalsMonthlyView } from '../components/LeadProfessionalsMonthlyView.js';
import { GlobalSearchModal } from '../components/GlobalSearchModal.js';
import { 
  LogOut, Plus, Search, Sun, Moon, Users, Linkedin, Globe, Sparkles
} from 'lucide-react';
import { apiFetch } from '../utils/api.js';

export const LeadDashboard: React.FC = () => {
  const { user, logout, theme, toggleTheme } = useAuth();
  const { toastSuccess, toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'REGISTER' | 'MONTHLY'>('REGISTER');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 9 Lead Tracking Attributes (All strictly optional/nullable)
  const [candidateName, setCandidateName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [email, setEmail] = useState('');
  const [linkedInUrl, setLinkedinUrl] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [visaStatus, setVisaStatus] = useState('US Citizen');
  const [sourcedBy, setSourcedBy] = useState(user?.identifier || 'Lead Specialist');
  const [sourcedFrom, setSourcedFrom] = useState('LinkedIn');
  const [attemptedBy, setAttemptedBy] = useState('');
  const [chatBrief, setChatBrief] = useState('');
  const [temperature, setTemperature] = useState<'Cold' | 'Warm' | 'Hot'>('Warm');
  const [loading, setLoading] = useState(false);

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    // Strictly optional/nullable - no client-side validation blockers
    setLoading(true);
    try {
      const payload = {
        candidateName: candidateName.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
        jobProfile: jobTitle.trim() || undefined,
        email: email.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        visaStatus: visaStatus.trim() || undefined,
        linkedInUrl: linkedInUrl.trim() || undefined,
        linkedinUrl: linkedInUrl.trim() || undefined,
        sourcedBy: sourcedBy.trim() || undefined,
        sourcedFrom: sourcedFrom.trim() || undefined,
        attemptedBy: attemptedBy.trim() || undefined,
        chatBrief: chatBrief.trim() || undefined,
        createdByName: sourcedBy.trim() || user?.identifier || 'Lead Specialist',
        salesRepName: attemptedBy.trim() || undefined,
        temperature,
        dealValueUsd: 0,
        isCold: temperature === 'Cold',
      };

      const res = await apiFetch<any>('/api/leads', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const registeredName = res?.candidateName || candidateName.trim() || 'New Lead';
      toastSuccess(`Lead "${registeredName}" captured and tracked successfully!`);
      setCandidateName('');
      setJobTitle('');
      setEmail('');
      setPhoneNumber('');
      setLinkedinUrl('');
      setVisaStatus('US Citizen');
      setSourcedBy(user?.identifier || 'Lead Specialist');
      setSourcedFrom('LinkedIn');
      setAttemptedBy('');
      setChatBrief('');
      setActiveTab('MONTHLY');
    } catch (err: any) {
      toastError(err.message || 'Failed to register lead.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-foreground flex flex-col relative transition-colors duration-200">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <NovotionLogo
            variant="header"
            badge="Lead Specialist"
            badgeColor="cyan"
            subtitle="Monthly Lead Aggregation"
          />

          <div className="flex items-center gap-2.5">
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        <div className="flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-slate-800/70 rounded-xl border border-slate-200/60 dark:border-slate-800 w-fit">
          <button
            onClick={() => setActiveTab('REGISTER')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'REGISTER'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            Register New Lead
          </button>

          <button
            onClick={() => setActiveTab('MONTHLY')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'MONTHLY'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Monthly Leads & Tier Directory
          </button>
        </div>

        {activeTab === 'MONTHLY' ? (
          <LeadProfessionalsMonthlyView />
        ) : (
          <div className="max-w-3xl mx-auto w-full glass-card rounded-2xl p-6 border-slate-200/80 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
            <div className="mb-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Capture & Track Lead (Flexible Intake)
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Every field is strictly optional. Partial and empty submissions are safely accepted.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Sparkles className="h-3 w-3" />
                All 9 Fields Optional
              </span>
            </div>

            <form onSubmit={handleSubmitLead} noValidate className="space-y-4">
              {/* 1. Candidate Full Name & Target Designation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Candidate Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Connor"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs glow-input font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Job Title / Target Designation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cloud Solutions Architect"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs glow-input font-medium"
                  />
                </div>
              </div>

              {/* 2. Contact Details: Email & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Candidate Email Address
                  </label>
                  <input
                    type="text"
                    placeholder="candidate@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs glow-input"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs glow-input"
                  />
                </div>
              </div>

              {/* 3. Work Authorization & LinkedIn */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Work Authorization / Visa Status
                  </label>
                  <select
                    value={visaStatus}
                    onChange={(e) => setVisaStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs glow-input font-semibold"
                  >
                    <option value="">Leave blank / Not specified</option>
                    <option value="US Citizen">US Citizen</option>
                    <option value="Green Card">Green Card / PR</option>
                    <option value="H-1B">H-1B Specialty Work</option>
                    <option value="OPT/CPT">OPT / CPT Student Visa</option>
                    <option value="TN Visa">TN Visa (NAFTA)</option>
                    <option value="L-1 / L-2">L-1 / L-2 Intra-Company</option>
                    <option value="Work Permit">Work Permit / EAD</option>
                    <option value="Other">Other Visa Status</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Linkedin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://linkedin.com/in/username"
                    value={linkedInUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs glow-input"
                  />
                </div>
              </div>

              {/* 4. Sourcing & Outreach Tracking */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-blue-500" />
                      Sourced From (Platform / Channel)
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Select or type custom</span>
                  </label>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      list="sourcedFromOptions"
                      placeholder="e.g. LinkedIn, GitHub, Facebook, Referral..."
                      value={sourcedFrom}
                      onChange={(e) => setSourcedFrom(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs glow-input"
                    />
                    <datalist id="sourcedFromOptions">
                      <option value="LinkedIn" />
                      <option value="GitHub" />
                      <option value="Facebook" />
                      <option value="Referral" />
                      <option value="Other" />
                    </datalist>
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      <span className="text-[10px] text-slate-400">Standard:</span>
                      {['LinkedIn', 'GitHub', 'Facebook', 'Referral', 'Other'].map((sourceOpt) => (
                        <button
                          key={sourceOpt}
                          type="button"
                          onClick={() => setSourcedFrom(sourceOpt)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer border ${
                            sourcedFrom.toLowerCase() === sourceOpt.toLowerCase()
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {sourceOpt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Sourced By (Lead Team Member)
                  </label>
                  <input
                    type="text"
                    placeholder="Name or ID of team member"
                    value={sourcedBy}
                    onChange={(e) => setSourcedBy(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs glow-input"
                  />
                </div>
              </div>

              {/* 5. Assigned Outreach Specialist & Temperature */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Attempted By (Assigned Sales Specialist)
                  </label>
                  <input
                    type="text"
                    list="salesRepsOptions"
                    placeholder="Name or ID of sales outreach member"
                    value={attemptedBy}
                    onChange={(e) => setAttemptedBy(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs glow-input"
                  />
                  <datalist id="salesRepsOptions">
                    <option value="Michael Scott" />
                    <option value="Alex Rivera" />
                    <option value="Sarah Jenkins" />
                    <option value="David Chen" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Lead Priority Tier
                  </label>
                  <select
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs glow-input font-semibold"
                  >
                    <option value="Warm">⚡ Warm Lead (In Discussion)</option>
                    <option value="Hot">🔥 Hot Lead (High Intent)</option>
                    <option value="Cold">❄️ Cold Lead (Uncontacted)</option>
                  </select>
                </div>
              </div>

              {/* 6. Chat Brief & Initial Discussion Screening Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Chat Brief & Initial Screening Discussion Notes
                </label>
                <textarea
                  rows={4}
                  placeholder="Multi-line notes summarizing what the lead generation team discussed or noted during initial screening..."
                  value={chatBrief}
                  onChange={(e) => setChatBrief(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs glow-input resize-y min-h-[90px]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  Submitting with empty or partial fields will succeed immediately.
                </span>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer border-none shadow-xs"
                >
                  {loading ? 'Recording Lead...' : 'Register / Track Lead'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
};
