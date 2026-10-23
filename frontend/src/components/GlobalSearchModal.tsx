import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../utils/api.js';
import { Search, X, Briefcase, ArrowRight } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSalesLead?: (lead: any) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectSalesLead,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    salesLeads: any[];
    totalMatches: number;
  } | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiFetch<any>(`/api/crm/global-search?q=${encodeURIComponent(query.trim())}`);
        setResults(data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: -10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -10 }}
          className="w-full max-w-2xl glass-card rounded-2xl p-5 relative z-10 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[80vh] bg-white dark:bg-slate-900"
        >
          <div className="relative flex items-center pb-4 border-b border-slate-100 dark:border-slate-800">
            <Search className="h-4.5 w-4.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              autoFocus
              placeholder="Search leads by candidate name, email, phone, rep, or profile..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 font-medium glow-input"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer border-none bg-transparent"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
            {loading ? (
              <div className="text-center py-12 text-xs text-slate-400">
                <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Searching sales leads...
              </div>
            ) : !query.trim() ? (
              <div className="text-center py-12 text-slate-400 text-xs font-medium">
                Type a candidate name, email, or company to search pipeline records.
              </div>
            ) : results && results.totalMatches === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-medium">
                No matching leads found for "{query}".
              </div>
            ) : results ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    Sales Pipeline Leads ({results.salesLeads.length})
                  </span>
                </div>

                <div className="space-y-2">
                  {results.salesLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => {
                        if (onSelectSalesLead) onSelectSalesLead(lead);
                        onClose();
                      }}
                      className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 hover:border-blue-500/40 cursor-pointer transition-all flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          {lead.candidateName}
                          <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md font-medium">
                            {lead.stage || 'New'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">{lead.email} &bull; {lead.phoneNumber}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px] border border-slate-200 dark:border-slate-700">
                          {lead.visaStatus || 'Citizen'}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer border-none"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
