import { useState } from 'react';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';
import { Send, Zap, Clock, FileText, Flame, BarChart3, CheckCircle2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  submitDailyReport, getTodayReport, getReportsHistory, getDailyStats,
  getWeeklySummary, getProductiveHours, getActivityHeatmap, getFocusIntegrityScore,
} from '@/lib/database';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AnimatedCounter from '@/components/AnimatedCounter';
import FocusTrendChart from '@/components/FocusTrendChart';
import WeeklySummaryCard from '@/components/WeeklySummaryCard';
import MiniHeatmap from '@/components/MiniHeatmap';

export default function DailyReport() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    studied: '', understood: '', explanation: '', exercises: '', confusingConcepts: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  const { data: existingReport, isLoading } = useQuery({
    queryKey: ['today-report', user?.id],
    queryFn: () => user ? getTodayReport(user.id) : null,
    enabled: !!user,
  });
  const { data: history } = useQuery({
    queryKey: ['report-history', user?.id],
    queryFn: () => user ? getReportsHistory(user.id, 14) : [],
    enabled: !!user,
  });
  const { data: dailyStats } = useQuery({
    queryKey: ['daily-stats', user?.id],
    queryFn: () => user ? getDailyStats(user.id, 7) : [],
    enabled: !!user,
  });
  const { data: weekly } = useQuery({
    queryKey: ['weekly-summary', user?.id],
    queryFn: () => user ? getWeeklySummary(user.id) : undefined,
    enabled: !!user,
  });
  const { data: hours } = useQuery({
    queryKey: ['productive-hours', user?.id],
    queryFn: () => user ? getProductiveHours(user.id, 30) : [],
    enabled: !!user,
  });
  const { data: heatmap } = useQuery({
    queryKey: ['activity-heatmap', user?.id],
    queryFn: () => user ? getActivityHeatmap(user.id, 120) : new Map(),
    enabled: !!user,
  });
  const { data: focusScore } = useQuery({
    queryKey: ['focus-integrity', user?.id],
    queryFn: () => user ? getFocusIntegrityScore(user.id) : null,
    enabled: !!user,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      await submitDailyReport({
        user_id: user.id,
        report_date: new Date().toISOString().split('T')[0],
        studied: form.studied,
        understood: form.understood,
        explanation: form.explanation,
        exercises: form.exercises || null,
        confusing_concepts: form.confusingConcepts || null,
      });
      toast.success('Report submitted — streak updated!');
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['today-report'] });
      queryClient.invalidateQueries({ queryKey: ['report-history'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['daily-stats'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-summary'] });
    } catch (error: any) {
      if (error.message?.includes('duplicate')) toast.error('You already submitted a report today!');
      else toast.error('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const fields = [
    { key: 'studied', label: 'What did you study?', placeholder: 'Topics, chapters, modules...' },
    { key: 'understood', label: 'What did you understand?', placeholder: 'Key takeaways and insights...' },
    { key: 'explanation', label: 'Explain it clearly', placeholder: 'Explain as if teaching someone...' },
    { key: 'exercises', label: 'Exercises completed', placeholder: 'Problems solved, projects built...' },
    { key: 'confusingConcepts', label: 'Confusing concepts (optional)', placeholder: "What's still unclear?" },
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  const today = dailyStats?.[dailyStats.length - 1];
  const topHour = (hours || []).reduce<{ hour: number; focusSeconds: number } | null>(
    (best, h) => (!best || h.focusSeconds > best.focusSeconds ? h : best),
    null
  );
  const fmtHour = (h: number) => {
    const ampm = h >= 12 ? 'pm' : 'am';
    const display = h % 12 === 0 ? 12 : h % 12;
    return `${display}${ampm}`;
  };

  return (
    <Layout>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Daily Reports</h1>
            <p className="mt-1 text-muted-foreground">Track output, focus, and trends over time.</p>
          </div>
          {!existingReport && !showForm && (
            <Button onClick={() => setShowForm(true)} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
              <Send className="mr-2 h-4 w-4" /> Submit Today's Report
            </Button>
          )}
          {existingReport && (
            <span className="inline-flex items-center gap-2 rounded-full border border-xp/30 bg-xp/10 px-3 py-1.5 text-xs font-medium text-xp">
              <CheckCircle2 className="h-3.5 w-3.5" /> Today submitted (+{existingReport.xp_earned} XP)
            </span>
          )}
        </motion.div>

        {/* Today snapshot */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[
            { label: 'Sessions Today', value: today?.sessions ?? 0, icon: FileText, color: 'text-primary' },
            { label: 'Focus Hours', value: (today?.focusSeconds ?? 0) / 3600, decimals: 1, icon: Clock, color: 'text-highlight' },
            { label: 'XP Today', value: today?.xp ?? 0, icon: Zap, color: 'text-xp' },
            { label: 'Focus Score', value: focusScore?.score ?? 0, decimals: 0, icon: BarChart3, color: 'text-level' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-card rounded-xl p-4 transition-transform hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className={`mt-2 font-display text-2xl font-bold ${s.color}`}>
                <AnimatedCounter value={s.value} decimals={s.decimals || 0} />
              </p>
            </motion.div>
          ))}
        </div>

        {/* Report form (collapsible) */}
        {!existingReport && showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-card rounded-xl p-6">
            <h2 className="font-display text-lg font-semibold text-foreground">Today's Reflection</h2>
            <p className="mt-1 text-sm text-muted-foreground">Prove what you learned and earn +50 XP.</p>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {fields.map(f => (
                <div key={f.key}>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{f.label}</label>
                  <textarea
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    rows={f.key === 'explanation' ? 4 : 2}
                    required={f.key !== 'confusingConcepts' && f.key !== 'exercises'}
                    className="w-full rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              ))}
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={submitting} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
                  <Send className="mr-2 h-4 w-4" /> {submitting ? 'Submitting...' : 'Submit (+50 XP)'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Focus & distraction trend */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground">Focus vs Distractions</h2>
              <span className="text-xs text-muted-foreground">Last 7 days</span>
            </div>
            <FocusTrendChart data={dailyStats || []} />
          </motion.div>

          {/* Productive periods */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6">
            <h2 className="mb-3 font-display text-lg font-semibold text-foreground">Productive Periods</h2>
            <p className="text-xs text-muted-foreground">Most productive hour</p>
            <p className="mt-1 font-display text-3xl font-bold text-gradient-primary">
              {topHour && topHour.focusSeconds > 0 ? fmtHour(topHour.hour) : '—'}
            </p>
            <div className="mt-4 flex h-20 items-end gap-[3px]">
              {(hours || []).map(h => {
                const max = Math.max(1, ...(hours || []).map(x => x.focusSeconds));
                const pct = (h.focusSeconds / max) * 100;
                return (
                  <div
                    key={h.hour}
                    title={`${fmtHour(h.hour)} — ${Math.round(h.focusSeconds / 60)}m`}
                    className="flex-1 rounded-sm bg-primary/60 transition-all hover:bg-primary"
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>12am</span><span>12pm</span><span>11pm</span>
            </div>
          </motion.div>

          {/* Heatmap */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6">
            <h2 className="mb-3 font-display text-lg font-semibold text-foreground">Consistency</h2>
            <MiniHeatmap data={heatmap || new Map()} weeks={14} />
          </motion.div>

          {/* Weekly summary */}
          <div className="lg:col-span-2">
            <WeeklySummaryCard data={weekly} loading={!weekly} />
          </div>
        </div>

        {/* History */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground">Report History</h2>
            <span className="text-xs text-muted-foreground">Last {history?.length || 0} entries</span>
          </div>
          {history && history.length > 0 ? (
            <div className="space-y-2">
              {history.map(r => (
                <div key={r.id} className="rounded-lg border border-border bg-muted/20 transition-colors hover:border-primary/40">
                  <button
                    onClick={() => setExpandedReport(expandedReport === r.id ? null : r.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-xp/10">
                        <Flame className="h-4 w-4 text-xp" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.studied || 'Daily Reflection'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.report_date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          {' • +'}{r.xp_earned} XP
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedReport === r.id ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedReport === r.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t border-border px-4 py-3 text-sm">
                      <div className="space-y-2">
                        {r.understood && <p><span className="text-muted-foreground">Understood:</span> <span className="text-foreground">{r.understood}</span></p>}
                        {r.explanation && <p><span className="text-muted-foreground">Explanation:</span> <span className="text-foreground">{r.explanation}</span></p>}
                        {r.exercises && <p><span className="text-muted-foreground">Exercises:</span> <span className="text-foreground">{r.exercises}</span></p>}
                        {r.confusing_concepts && <p><span className="text-muted-foreground">Confusing:</span> <span className="text-streak">{r.confusing_concepts}</span></p>}
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No reports yet — submit your first one above.</p>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
