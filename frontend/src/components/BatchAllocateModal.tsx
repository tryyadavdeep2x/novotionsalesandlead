import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../utils/api.js';
import { useToast } from './Toast.js';
import { 
  Zap, X, Shuffle, Users, CheckCircle2, Layers
} from 'lucide-react';

interface BatchAllocateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAllocated?: () => void;
}

const DEFAULT_SALES_REPS = [
  { name: 'Michael Scott', role: 'Closing Sales Specialist', active: true },
  { name: 'Alex Rivera', role: 'Senior Sales Closer', active: true },
  { name: 'Sarah Jenkins', role: 'Enterprise Account Closer', active: true },
  { name: 'David Chen', role: 'Technical Sales Specialist', active: true },
];

export const BatchAllocateModal: React.FC<BatchAllocateModalProps> = ({
  isOpen,
  onClose,
  onAllocated,
}) => {
  const { toastSuccess, toastError } = useToast();

  const [leadsPerRep, setLeadsPerRep] = useState<number>(20);
  const [selectedReps, setSelectedReps] = useState<string[]>(
    DEFAULT_SALES_REPS.map(r => r.name)
  );
  const [mode, setMode] = useState<'all_leads' | 'unassigned_only'>('all_leads');
  const [autoGenerateIfShort, setAutoGenerateIfShort] = useState<boolean>(true);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any | null>(null);

  const totalToAllocate = selectedReps.length * leadsPerRep;

  const toggleRep = (repName: string) => {
    if (selectedReps.includes(repName)) {
      if (selectedReps.length === 1) {
        toastError('At least one Sales Representative must be selected.');
        return;
      }
      setSelectedReps(selectedReps.filter(r => r !== repName));
    } else {
      setSelectedReps([...selectedReps, repName]);
    }
  };

  const handleRunAllocation = async () => {
    if (selectedReps.length === 0) {
      toastError('Please select at least one Sales Representative.');
      return;
    }

    setLoading(true);
    setResults(null);
    try {
      const response = await apiFetch<any>('/api/admin/leads/batch-allocate', {
        method: 'POST',
        body: JSON.stringify({
          leadsPerRep,
          reps: selectedReps,
          mode,
          autoGenerateIfShort,
        }),
      });

      setResults(response);
      toastSuccess(response.message || `Allocated ${response.totalAllocated} leads successfully!`);
      if (onAllocated) onAllocated();
    } catch (err: any) {
      toastError(err.message || 'Failed to complete batch random lead allocation.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    onClose();
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
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-xl glass-card rounded-3xl p-6 relative z-10 border-slate-200 dark:border-slate-800 shadow-2xl text-foreground text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-foreground">
                  1-Click Random Batch Lead Distributor
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Allocate 20 randomized leads per Sales Representative in one go.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="py-4 space-y-4 text-xs">
            {!results ? (
              <>
                {/* Quota Selector */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-blue-600" />
                      Batch Quota per Representative
                    </label>
                    <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                      {leadsPerRep} Leads / Rep
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {[10, 20, 25, 50].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setLeadsPerRep(num)}
                        className={`flex-1 py-1.5 rounded-xl font-bold transition-all cursor-pointer border ${
                          leadsPerRep === num
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                        }`}
                      >
                        {num} Leads
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Sales Team Members */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-blue-600" />
                      Target Sales Representatives ({selectedReps.length} Selected)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedReps.length === DEFAULT_SALES_REPS.length) {
                          setSelectedReps([DEFAULT_SALES_REPS[0].name]);
                        } else {
                          setSelectedReps(DEFAULT_SALES_REPS.map(r => r.name));
                        }
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:underline border-none bg-transparent cursor-pointer"
                    >
                      {selectedReps.length === DEFAULT_SALES_REPS.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DEFAULT_SALES_REPS.map((rep) => {
                      const isSelected = selectedReps.includes(rep.name);
                      return (
                        <div
                          key={rep.name}
                          onClick={() => toggleRep(rep.name)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-500/10 border-blue-500 text-foreground'
                              : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
                          }`}
                        >
                          <div>
                            <span className="font-extrabold text-xs block">{rep.name}</span>
                            <span className="text-[10px] text-slate-400">{rep.role}</span>
                          </div>
                          <div className={`h-4 w-4 rounded-md flex items-center justify-center border ${
                            isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-700'
                          }`}>
                            {isSelected && <CheckCircle2 className="h-3 w-3" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pool Mode & Auto-generate options */}
                <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Lead Source Pool:</span>
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setMode('all_leads')}
                        className={`px-2 py-0.5 rounded-md cursor-pointer border-none ${mode === 'all_leads' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                      >
                        All Active Leads
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('unassigned_only')}
                        className={`px-2 py-0.5 rounded-md cursor-pointer border-none ${mode === 'unassigned_only' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                      >
                        Unassigned Only
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={autoGenerateIfShort}
                      onChange={(e) => setAutoGenerateIfShort(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Auto-provision fresh realistic candidate leads if pool is below target quota ({totalToAllocate} leads).</span>
                  </label>
                </div>

                {/* Summary calculation highlight */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-cyan-600/10 to-transparent border border-blue-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shuffle className="h-4 w-4 text-blue-600" />
                    <div>
                      <span className="font-extrabold text-foreground text-xs block">Ready to Distribute</span>
                      <span className="text-[10px] text-slate-400">
                        {selectedReps.length} Representatives &bull; {leadsPerRep} Leads each
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-blue-600 dark:text-blue-400">
                      {totalToAllocate} Leads
                    </span>
                  </div>
                </div>
              </>
            ) : (
              /* Results View */
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-xs">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                      Allocation Successfully Executed!
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      {results.message}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Breakdown per Sales Representative
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(results.allocationSummary || {}).map(([rep, count]: [string, any]) => (
                      <div
                        key={rep}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                      >
                        <span className="font-bold text-foreground">{rep}</span>
                        <span className="font-extrabold text-xs px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {count} Leads Allocated
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  * Sales representatives will now immediately see their assigned 20 leads upon logging into their calling workspace.
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            {!results ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRunAllocation}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 cursor-pointer border-none transition-all"
                >
                  <Zap className="h-4 w-4" />
                  {loading ? 'Allocating Leads...' : `Allocate ${leadsPerRep} Leads per Rep Now (${totalToAllocate} Total)`}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer border-none"
              >
                Done & View Sales Dashboard
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
