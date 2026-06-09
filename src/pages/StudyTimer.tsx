import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, RotateCcw, Zap, AlertTriangle, Clock, History, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { startStudySession, endStudySession, getTodaySessions, getLearningGoals, getSessionHistory, heartbeatStudySession, type LearningGoal } from '@/lib/database';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import ReflectionModal from '@/components/study/ReflectionModal';
import { Link } from 'react-router-dom';

type TimerState = 'idle' | 'running' | 'paused';

const MOTIVATIONS = [
  'Deep work beats long work.',
  'You are building memory, not just minutes.',
  'Small reps. Big compounding.',
  'Focus is a skill. You are training it now.',
  'One concept truly understood > ten skimmed.',
  'Breathe. Stay with the problem.',
];

const BLOCK_LABELS: Record<string, string> = {
  input: 'Input',
  breakdown: 'Breakdown',
  practice: 'Practice',
  output: 'Output',
  review: 'Review',
};

const POMODORO_PRESETS = [
  { label: '25 min', seconds: 25 * 60 },
  { label: '50 min', seconds: 50 * 60 },
  { label: '90 min', seconds: 90 * 60 },
  { label: 'Custom', seconds: 0 },
];

export default function StudyTimer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Persisted timer state — survives tab switches, remounts, and background throttling.
  const STORAGE_KEY = 'learnflow:study-timer';
  type PersistedTimer = {
    state: TimerState;
    startedAt: number | null;
    accumulated: number;
    sessionId: string | null;
    block: string;
    topic: string;
    goalId: string;
    conceptId: string;
    notes: string;
    interruptions: number;
    targetDuration: number;
    isCustomDuration: boolean;
    customMinutes: string;
    tags: string;
  };
  const loadPersisted = (): Partial<PersistedTimer> => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };
  const persisted = loadPersisted();



  const [state, setState] = useState<TimerState>(persisted.state ?? 'idle');
  const [startedAt, setStartedAt] = useState<number | null>(persisted.startedAt ?? null);
  const [accumulated, setAccumulated] = useState<number>(persisted.accumulated ?? 0);
  const [seconds, setSeconds] = useState<number>(
    (persisted.accumulated ?? 0) +
      (persisted.state === 'running' && persisted.startedAt
        ? Math.floor((Date.now() - persisted.startedAt) / 1000)
        : 0)
  );

  const [selectedBlock, setSelectedBlock] = useState(persisted.block ?? 'practice');
  const [topic, setTopic] = useState(persisted.topic ?? '');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(persisted.sessionId ?? null);
  const [selectedGoalId, setSelectedGoalId] = useState<string>(persisted.goalId ?? '');
  const [selectedConceptId, setSelectedConceptId] = useState<string>(persisted.conceptId ?? '');
  const [notes, setNotes] = useState(persisted.notes ?? '');
  const [interruptions, setInterruptions] = useState(persisted.interruptions ?? 0);
  const [targetDuration, setTargetDuration] = useState(persisted.targetDuration ?? 25 * 60);
  const [customMinutes, setCustomMinutes] = useState(persisted.customMinutes ?? '');
  const [isCustomDuration, setIsCustomDuration] = useState(persisted.isCustomDuration ?? false);
  const [tags, setTags] = useState<string>(persisted.tags ?? '');

  // Reflection modal state — opens after a session is stopped.
  const [reflection, setReflection] = useState<{ sessionId: string; duration: number; topic: string; tags: string[] } | null>(null);
  // Fullscreen focus mode.
  const [fullscreen, setFullscreen] = useState(false);
  // Rotating motivational prompt during a session.
  const [motivationIdx, setMotivationIdx] = useState(0);

  useEffect(() => {
    const data: PersistedTimer = {
      state, startedAt, accumulated,
      sessionId: currentSessionId,
      block: selectedBlock, topic,
      goalId: selectedGoalId, conceptId: selectedConceptId,
      notes, interruptions, targetDuration, isCustomDuration, customMinutes, tags,
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  }, [state, startedAt, accumulated, currentSessionId, selectedBlock, topic, selectedGoalId, selectedConceptId, notes, interruptions, targetDuration, isCustomDuration, customMinutes, tags]);

  useEffect(() => {
    if (state !== 'running') return;
    const id = setInterval(() => setMotivationIdx(i => (i + 1) % MOTIVATIONS.length), 12000);
    return () => clearInterval(id);
  }, [state]);


  // Disable refetchOnWindowFocus so returning to the tab doesn't trigger reloads.
  const { data: goals } = useQuery({
    queryKey: ['learning-goals', user?.id],
    queryFn: () => user ? getLearningGoals(user.id) : [],
    enabled: !!user,
    refetchOnWindowFocus: false,
  });

  const selectedGoal = goals?.find(g => g.id === selectedGoalId) as LearningGoal | undefined;
  const concepts: any[] = (selectedGoal as any)?.concepts || [];

  const { data: todaySessions } = useQuery({
    queryKey: ['today-sessions', user?.id],
    queryFn: () => user ? getTodaySessions(user.id) : [],
    enabled: !!user,
    refetchOnWindowFocus: false,
  });

  const { data: sessionHistory } = useQuery({
    queryKey: ['session-history', user?.id],
    queryFn: () => user ? getSessionHistory(user.id, 10) : [],
    enabled: !!user,
    refetchOnWindowFocus: false,
  });

  const sessionsToday = todaySessions?.length || 0;
  const totalSeconds = todaySessions?.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) || 0;
  const totalXp = todaySessions?.reduce((acc, s) => acc + (s.xp_earned || 0), 0) || 0;

  // Wall-clock tick — recomputes from timestamps so background throttling never loses time.
  useEffect(() => {
    const tick = () => setSeconds(
      accumulated + (state === 'running' && startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0)
    );
    tick();
    if (state !== 'running') return;
    const interval = setInterval(tick, 1000);
    const onVisible = () => tick();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [state, startedAt, accumulated]);

  // Warn before closing tab while a session is active.
  useEffect(() => {
    if (state === 'idle') return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [state]);

  // Backend heartbeat — periodically sync active session duration so the session
  // can't be lost on backgrounding, throttled tabs, network blips, or accidental closes.
  useEffect(() => {
    if (state !== 'running' || !currentSessionId) return;

    const sync = () => {
      const elapsed =
        accumulated + (startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0);
      if (elapsed <= 0) return;
      heartbeatStudySession(currentSessionId, elapsed, interruptions).catch(() => {
        // Swallow errors — heartbeat is best-effort; next tick will retry.
      });
    };

    sync();
    const interval = setInterval(sync, 20000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') sync();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', sync);
    window.addEventListener('pagehide', sync);

    return () => {
      clearInterval(interval);
      sync();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', sync);
      window.removeEventListener('pagehide', sync);
    };
  }, [state, currentSessionId, startedAt, accumulated, interruptions]);


  const formatTime = useCallback((s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }, []);

  const progress = targetDuration > 0 ? Math.min((seconds / targetDuration) * 100, 100) : 0;

  const handleStart = async () => {
    if (!user) return;

    if (state === 'paused') {
      setStartedAt(Date.now());
      setState('running');
      return;
    }

    try {
      const session = await startStudySession(user.id, topic || 'General Study', selectedBlock, {
        goalId: selectedGoalId || undefined,
        conceptId: selectedConceptId || undefined,
        notes: notes || undefined,
        targetDuration: targetDuration || undefined,
      });
      setCurrentSessionId(session.id);
      setAccumulated(0);
      setStartedAt(Date.now());
      setState('running');
    } catch (error) {
      toast.error('Failed to start session');
    }
  };

  const handlePause = () => {
    if (state === 'running' && startedAt) {
      setAccumulated(a => a + Math.floor((Date.now() - startedAt) / 1000));
      setStartedAt(null);
    }
    setState('paused');
  };

  const handleStop = async () => {
    const finalSeconds =
      accumulated + (state === 'running' && startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0);
    const stoppedSessionId = currentSessionId;
    const stoppedTopic = topic || 'General Study';
    const stoppedTags = tags.split(',').map(t => t.trim()).filter(Boolean);

    if (stoppedSessionId && finalSeconds > 0) {
      try {
        await endStudySession(stoppedSessionId, finalSeconds, interruptions);
        const xpEarned = Math.min(Math.floor(finalSeconds / 180), 20);
        toast.success(`Session ended! +${xpEarned} XP earned`);
        queryClient.invalidateQueries({ queryKey: ['today-sessions'] });
        queryClient.invalidateQueries({ queryKey: ['session-history'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      } catch (error) {
        toast.error('Failed to save session');
      }
    }

    setState('idle');
    setStartedAt(null);
    setAccumulated(0);
    setSeconds(0);
    setCurrentSessionId(null);
    setInterruptions(0);
    setNotes('');
    setTags('');
    setFullscreen(false);
    try { localStorage.removeItem('learnflow:study-timer'); } catch {}

    // Trigger reflection capture for completed work.
    if (stoppedSessionId && finalSeconds >= 30 && user) {
      setReflection({ sessionId: stoppedSessionId, duration: finalSeconds, topic: stoppedTopic, tags: stoppedTags });
    }
  };


  const handleReset = () => {
    setAccumulated(0);
    setStartedAt(state === 'running' ? Date.now() : null);
    setSeconds(0);
  };


  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Study Timer</h1>
            <p className="mt-1 text-muted-foreground">Focus deeply. Reflect. Build memory.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/memory">Learning Memory</Link>
            </Button>
            {state !== 'idle' && (
              <Button variant="outline" size="sm" onClick={() => setFullscreen(f => !f)} className="gap-1.5">
                {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                {fullscreen ? 'Exit Focus' : 'Focus Mode'}
              </Button>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {state === 'running' && (
            <motion.p
              key={motivationIdx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-center text-sm italic text-primary/80"
            >
              {MOTIVATIONS[motivationIdx]}
            </motion.p>
          )}
        </AnimatePresence>


        {/* Timer Display with Progress Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`glass-card rounded-2xl p-10 text-center ${state === 'running' ? 'shadow-glow-primary' : ''}`}
        >
          <div className="relative mx-auto" style={{ width: 200, height: 200 }}>
            <svg width={200} height={200} className="-rotate-90">
              <circle cx={100} cy={100} r={88} fill="none" stroke="hsl(var(--muted))" strokeWidth={8} />
              <motion.circle
                cx={100} cy={100} r={88} fill="none"
                stroke={progress >= 100 ? 'hsl(var(--xp-green))' : 'hsl(var(--primary))'}
                strokeWidth={8} strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 88}
                animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - progress / 100) }}
                transition={{ duration: 0.5 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className={`font-display text-4xl font-bold tracking-tight ${state === 'running' ? 'text-gradient-primary' : 'text-foreground'}`}>
                {formatTime(seconds)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {targetDuration > 0 ? `Target: ${Math.floor(targetDuration / 60)}min` : 'Free session'}
              </p>
            </div>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            {state === 'idle' ? 'Ready to focus' : state === 'running' ? 'Session in progress...' : 'Paused'}
          </p>

          {/* Interruption Counter (during session) */}
          {state !== 'idle' && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInterruptions(i => i + 1)}
                className="gap-1.5 text-streak"
              >
                <AlertTriangle className="h-3.5 w-3.5" /> Interruption ({interruptions})
              </Button>
            </div>
          )}

          {/* Controls */}
          <div className="mt-6 flex items-center justify-center gap-4">
            {state === 'idle' && (
              <Button onClick={handleStart} className="bg-gradient-primary px-8 py-6 text-lg text-primary-foreground hover:opacity-90">
                <Play className="mr-2 h-5 w-5" /> Start Session
              </Button>
            )}
            {state === 'running' && (
              <>
                <Button onClick={handlePause} variant="outline" size="lg">
                  <Pause className="mr-2 h-4 w-4" /> Pause
                </Button>
                <Button onClick={handleStop} variant="destructive" size="lg">
                  <Square className="mr-2 h-4 w-4" /> Stop
                </Button>
              </>
            )}
            {state === 'paused' && (
              <>
                <Button onClick={handleStart} className="bg-gradient-primary text-primary-foreground hover:opacity-90" size="lg">
                  <Play className="mr-2 h-4 w-4" /> Resume
                </Button>
                <Button onClick={handleReset} variant="outline" size="lg">
                  <RotateCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
                <Button onClick={handleStop} variant="destructive" size="lg">
                  <Square className="mr-2 h-4 w-4" /> Stop
                </Button>
              </>
            )}
          </div>
        </motion.div>

        {/* Session Config */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Session Details</h2>
          <div className="space-y-4">
            {/* Duration Presets */}
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">Duration</label>
              <div className="flex flex-wrap gap-2">
                {POMODORO_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      if (state !== 'idle') return;
                      if (preset.seconds === 0) {
                        setIsCustomDuration(true);
                      } else {
                        setIsCustomDuration(false);
                        setTargetDuration(preset.seconds);
                      }
                    }}
                    disabled={state !== 'idle'}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                      !isCustomDuration && targetDuration === preset.seconds
                        ? 'bg-gradient-primary text-primary-foreground'
                        : isCustomDuration && preset.seconds === 0
                        ? 'bg-gradient-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              {isCustomDuration && (
                <input
                  type="number"
                  value={customMinutes}
                  onChange={(e) => {
                    setCustomMinutes(e.target.value);
                    const mins = parseInt(e.target.value);
                    if (mins > 0) setTargetDuration(mins * 60);
                  }}
                  placeholder="Minutes"
                  disabled={state !== 'idle'}
                  className="mt-2 w-32 rounded-lg border border-border bg-muted/50 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
              )}
            </div>

            {/* Goal Selector */}
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">Goal</label>
              <select
                value={selectedGoalId}
                onChange={(e) => {
                  setSelectedGoalId(e.target.value);
                  setSelectedConceptId('');
                }}
                disabled={state !== 'idle'}
                className="w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              >
                <option value="">No specific goal</option>
                {goals?.filter(g => g.is_active).map(g => (
                  <option key={g.id} value={g.id}>{g.description}</option>
                ))}
              </select>
            </div>

            {/* Concept Selector */}
            {concepts.length > 0 && (
              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">Concept</label>
                <select
                  value={selectedConceptId}
                  onChange={(e) => setSelectedConceptId(e.target.value)}
                  disabled={state !== 'idle'}
                  className="w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                >
                  <option value="">All concepts</option>
                  {concepts.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Topic */}
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What are you studying?"
                disabled={state !== 'idle'}
                className="w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
            </div>

            {/* Learning Block */}
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">Learning Block</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(BLOCK_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => state === 'idle' && setSelectedBlock(key)}
                    disabled={state !== 'idle'}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${selectedBlock === key ? 'bg-gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Session notes..."
                rows={2}
                className="w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="comma, separated (e.g. golang, pointers)"
                className="w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Searchable from your Learning Memory.</p>
            </div>
          </div>
        </motion.div>

        {/* Today's Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="grid grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-xp">{sessionsToday}</p>
            <p className="text-xs text-muted-foreground">Sessions today</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-streak">{(totalSeconds / 3600).toFixed(1)}h</p>
            <p className="text-xs text-muted-foreground">Total focus time</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-level">+{totalXp}</p>
            <p className="text-xs text-muted-foreground">XP earned today</p>
          </div>
        </motion.div>

        {/* Session History */}
        {sessionHistory && sessionHistory.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card rounded-xl p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <History className="h-5 w-5" /> Session History
            </h2>
            <div className="space-y-2">
              {sessionHistory.map((session: any) => (
                <div key={session.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{session.topic}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(session.duration_seconds / 60)}min • {session.block_type}
                        {session.interruptions > 0 && ` • ${session.interruptions} interruptions`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-xp">+{session.xp_earned} XP</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(session.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Fullscreen Focus Mode overlay */}
      <AnimatePresence>
        {fullscreen && state !== 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-background/95 backdrop-blur-2xl"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.15),transparent_60%)]" />
            <div className="relative z-10 flex flex-col items-center gap-8">
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
                {topic || 'Deep work'}
              </p>
              <p className={`font-display text-7xl font-bold tracking-tight md:text-9xl ${state === 'running' ? 'text-gradient-primary' : 'text-foreground'}`}>
                {formatTime(seconds)}
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={motivationIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="max-w-md text-center text-base italic text-primary/80"
                >
                  {MOTIVATIONS[motivationIdx]}
                </motion.p>
              </AnimatePresence>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {state === 'running' ? (
                  <Button onClick={handlePause} variant="outline" size="lg">
                    <Pause className="mr-2 h-4 w-4" /> Pause
                  </Button>
                ) : (
                  <Button onClick={handleStart} className="bg-gradient-primary text-primary-foreground hover:opacity-90" size="lg">
                    <Play className="mr-2 h-4 w-4" /> Resume
                  </Button>
                )}
                <Button onClick={() => setInterruptions(i => i + 1)} variant="outline" size="lg" className="text-streak">
                  <AlertTriangle className="mr-2 h-4 w-4" /> Interruption ({interruptions})
                </Button>
                <Button onClick={handleStop} variant="destructive" size="lg">
                  <Square className="mr-2 h-4 w-4" /> End
                </Button>
                <Button onClick={() => setFullscreen(false)} variant="ghost" size="lg">
                  <Minimize2 className="mr-2 h-4 w-4" /> Exit
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ReflectionModal
        open={!!reflection}
        onOpenChange={(o) => { if (!o) setReflection(null); }}
        sessionId={reflection?.sessionId ?? null}
        userId={user?.id ?? null}
        initialTags={reflection?.tags ?? []}
        durationSeconds={reflection?.duration ?? 0}
        topic={reflection?.topic ?? ''}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['session-history'] });
          queryClient.invalidateQueries({ queryKey: ['learning-memory'] });
        }}
      />
    </Layout>
  );
}
