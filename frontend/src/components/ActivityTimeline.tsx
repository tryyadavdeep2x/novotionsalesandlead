import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api.js';
import { useToast } from './Toast.js';
import { 
  MessageSquare, Send, Clock, User, CheckCircle2, 
  AlertCircle, PhoneCall, HelpCircle, XCircle, Sparkles, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export interface InteractionItem {
  id: string;
  leadId: string;
  salesRepName: string;
  status: string;
  candidateFeedback: string;
  updatedAt: string;
}

interface ActivityTimelineProps {
  leadId: string;
  currentStatus: string;
  onStatusUpdated?: (newStatus: string) => void;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  leadId,
  currentStatus,
  onStatusUpdated,
}) => {
  const { user } = useAuth();
  const { toastSuccess, toastError } = useToast();

  const [interactions, setInteractions] = useState<InteractionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Append comment form state
  const [newComment, setNewComment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(currentStatus || 'Interested');

  const isReadOnlyUser = user?.role === 'LEAD_TEAM';

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<InteractionItem[]>(`/api/sales/interactions/${leadId}`);
      setInteractions(data);
    } catch (err: any) {
      console.error('Failed to fetch timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchTimeline();
      setSelectedStatus(currentStatus || 'Interested');
    }
  }, [leadId, currentStatus]);

  const handleAppendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toastError('Please enter a comment or call outcome note.');
      return;
    }

    setSubmitting(true);
    try {
      const author = user?.identifier || (user?.role === 'ADMIN' ? 'Admin' : 'Sales Specialist');

      await apiFetch('/api/sales/interaction', {
        method: 'POST',
        body: JSON.stringify({
          leadId,
          salesRepName: author,
          status: selectedStatus,
          candidateFeedback: newComment.trim(),
        }),
      });

      toastSuccess('Timeline comment and status logged successfully!');
      setNewComment('');
      if (onStatusUpdated) {
        onStatusUpdated(selectedStatus);
      }
      fetchTimeline();
    } catch (err: any) {
      toastError(err.message || 'Failed to append timeline comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Interested':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
            <CheckCircle2 className="h-3 w-3" /> Interested
          </span>
        );
      case 'Maybe Interested':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25">
            <HelpCircle className="h-3 w-3" /> Maybe Interested
          </span>
        );
      case 'No Response':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
            <PhoneCall className="h-3 w-3" /> No Response
          </span>
        );
      case 'Not Interested':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">
            <XCircle className="h-3 w-3" /> Not Interested
          </span>
        );
      case 'Converted':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25">
            <Sparkles className="h-3 w-3" /> Converted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {st || 'Updated'}
          </span>
        );
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
            Activity & Timeline History
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
            {interactions.length} Logged {interactions.length === 1 ? 'Entry' : 'Entries'}
          </span>
          <button
            type="button"
            onClick={fetchTimeline}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent"
            title="Refresh Timeline"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Append New Comment Form (Only for Sales & Admin; locked for Lead Gen team) */}
      {!isReadOnlyUser ? (
        <form onSubmit={handleAppendComment} className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <User className="h-3 w-3 text-blue-600" />
              Logged As: <strong className="text-foreground">{user?.identifier || 'Sales Specialist'}</strong>
            </span>

            <div className="flex items-center gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Outcome Status:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Interested">Interested</option>
                <option value="Maybe Interested">Maybe Interested</option>
                <option value="No Response">No Response</option>
                <option value="Not Interested">Not Interested</option>
                <option value="Converted">Converted</option>
              </select>
            </div>
          </div>

          <textarea
            rows={2}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Append call notes, customer reaction, decision maker details, next step..."
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-foreground text-xs glow-input resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400 italic">
              * Log entries are permanently recorded and append-only.
            </span>
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer border-none shadow-xs"
            >
              <Send className="h-3.5 w-3.5" />
              {submitting ? 'Logging...' : 'Append Comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
          <span>Lead Team access is view-only. Activity updates are reserved for Closing Sales Reps & Admins.</span>
        </div>
      )}

      {/* Chronological Descending Timeline List */}
      <div className="flex-1 overflow-y-auto max-h-[360px] pr-1 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-xs text-slate-400">Loading activity timeline...</div>
        ) : interactions.length === 0 ? (
          <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
            <MessageSquare className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500">No interaction activity recorded yet.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Use the comment box above to log your first client call or touchpoint.</p>
          </div>
        ) : (
          interactions.map((item, idx) => (
            <div
              key={item.id || idx}
              className="relative pl-6 pb-2 border-l-2 border-blue-500/20 last:border-l-0 dark:border-blue-500/20 group"
            >
              {/* Timeline Bullet */}
              <div className="absolute -left-[9px] top-0.5 h-4 w-4 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-400 flex items-center justify-center shadow-xs">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-foreground flex items-center gap-1">
                      <User className="h-3 w-3 text-blue-600" />
                      {item.salesRepName}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    {formatTimestamp(item.updatedAt)}
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {item.candidateFeedback}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
