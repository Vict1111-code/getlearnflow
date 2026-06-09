import Layout from '@/components/Layout';
import { motion } from 'framer-motion';
import {
  Zap, Flame, Clock, FileText, TrendingUp, BookOpen, Target, ArrowRight, Timer,
  Brain, Users, Sparkles, Plus, PenLine, MessageCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import {
  getProfile, getStudyPlans, getTodaySessions, getFocusIntegrityScore,
  getRecentActivity, getLearningGoals, getActivityHeatmap, getPosts,
} from '@/lib/database';
import FocusGauge from '@/components/FocusGauge';
import AnimatedCounter from '@/components/AnimatedCounter';
import MiniHeatmap from '@/components/MiniHeatmap';
import SessionRecoveryBanner from '@/components/study/SessionRecoveryBanner';
import { useStreakMaintenance } from '@/hooks/useStreakMaintenance';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const levels = [
  { name: 'Beginner', min: 0, max: 1000 },
  { name: 'Intermediate', min: 1000, max: 5000 },
  { name: 'Advanced', min: 5000, max: 15000 },
  { name: 'Master', min: 15000, max: 50000 },
];

export default function Dashboard() {
  const { user } = useAuth();
  useStreakMaintenance();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id], queryFn: () => user ? getProfile(user.id) : null, enabled: !!user,
  });
  const { data: studyPlans } = useQuery({
    queryKey: ['study-plans', user?.id], queryFn: () => user ? getStudyPlans(user.id) : [], enabled: !!user,
  });
  const { data: todaySessions } = useQuery({
    queryKey: ['today-sessions', user?.id], queryFn: () => user ? getTodaySessions(user.id) : [], enabled: !!user,
  });
  const { data: focusScore } = useQuery({
    queryKey: ['focus-integrity', user?.id], queryFn: () => user ? getFocusIntegrityScore(user.id) : null, enabled: !!user,
  });
  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity', user?.id], queryFn: () => user ? getRecentActivity(user.id, 6) : [], enabled: !!user,
  });
  const { data: goals } = useQuery({
    queryKey: ['learning-goals', user?.id], queryFn: () => user ? getLearningGoals(user.id) : [], enabled: !!user,
  });
  const { data: heatmap } = useQuery({
    queryKey: ['activity-heatmap', user?.id], queryFn: () => user ? getActivityHeatmap(user.id, 100) : new Map(), enabled: !!user,
  });
  const { data: communityPosts } = useQuery({
    queryKey: ['community-recent'], queryFn: () => getPosts(), staleTime: 60_000,
  });

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Learner';
  const xp = profile?.xp || 0;
  const streak = profile?.streak || 0;
  const hoursToday = (todaySessions?.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) || 0) / 3600;
  const sessionsToday = todaySessions?.length || 0;

  const currentLevel = levels.find(l => xp >= l.min && xp < l.max) || levels[3];
  const progress = ((xp - currentLevel.min) / (currentLevel.max - currentLevel.min)) * 100;

  const dayOfWeek = new Date().getDay();
  const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const todayPlan = studyPlans?.find(p => p.day_of_week === adjustedDay);
  const blocks = (todayPlan?.blocks as any[]) || [];
  const completedBlocks = blocks.filter((b: any) => b.completed).length;
  const totalBlocks = blocks.length || 1;
  const blockPct = (completedBlocks / totalBlocks) * 100;

  const activeGoals = (goals || []).filter(g => g.is_active);
  const recentTopics = Array.from(new Set((todaySessions || []).map(s => s.topic).filter(Boolean))).slice(0, 5);
  const recentPosts = (communityPosts || []).slice(0, 4);

  const statCards = [
    { label: 'Total XP', value: xp, icon: Zap, color: 'text-xp', glow: 'shadow-glow-xp', decimals: 0 },
    { label: 'Day Streak', value: streak, icon: Flame, color: 'text-streak', glow: 'shadow-glow-streak', decimals: 0 },
    { label: 'Hours Today', value: hoursToday, icon: Clock, color: 'text-highlight', glow: '', decimals: 1 },
    { label: 'Sessions', value: sessionsToday, icon: FileText, color: 'text-level', glow: '', decimals: 0 },
  ];

  const quickActions = [
    { to: '/study', label: 'Start Session', icon: Timer, variant: 'primary' as const },
    { to: '/ai', label: 'Ask AI', icon: Sparkles, variant: 'ghost' as const },
    { to: '/goals', label: 'Create Goal', icon: Plus, variant: 'ghost' as const },
    { to: '/analytics', label: 'View Analysis', icon: TrendingUp, variant: 'ghost' as const },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <SessionRecoveryBanner />
        {/* Header */}
        <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Welcome back, <span className="text-gradient-primary">{displayName.split(' ')[0]}</span>
            </h1>
            <p className="mt-1 text-muted-foreground">
              {streak > 0 ? `You're on a ${streak}-day streak — keep the momentum.` : 'Start your learning journey today.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-level/30 bg-level/10 px-3 py-1.5 text-xs font-medium text-level">
              <TrendingUp className="h-3.5 w-3.5" /> {profile?.level || 'Beginner'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-xp/30 bg-xp/10 px-3 py-1.5 text-xs font-medium text-xp">
              <Zap className="h-3.5 w-3.5" /> <AnimatedCounter value={xp} /> XP
            </span>
          </div>
        </motion.div>

        {/* Stat cards (animated counters) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              {...fadeUp}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ y: -2 }}
              className={`glass-card rounded-xl p-5 transition-shadow ${stat.glow} hover:border-primary/40`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className={`mt-2 font-display text-3xl font-bold ${stat.color}`}>
                <AnimatedCounter value={stat.value} decimals={stat.decimals} />
              </p>
            </motion.div>
          ))}
        </div>

        {/* Main grid: 2-col main + right sidebar */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Today's Focus */}
            <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-lg font-semibold text-foreground">Today's Focus</h2>
                </div>
                <Link to="/plan" className="flex items-center gap-1 text-sm text-primary hover:underline">
                  Full plan <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {blocks.length > 0 ? (
                <>
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{completedBlocks} of {totalBlocks} blocks completed</span>
                      <span className="font-medium text-xp">{Math.round(blockPct)}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full bg-gradient-xp"
                        initial={{ width: 0 }} animate={{ width: `${blockPct}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {blocks.slice(0, 5).map((block: any) => (
                      <div key={block.id} className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${block.completed ? 'border-xp/20 bg-xp/5' : 'border-border bg-muted/30 hover:border-primary/30'}`}>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold uppercase ${block.completed ? 'bg-gradient-xp text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          {block.type?.charAt(0) || 'P'}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${block.completed ? 'text-foreground line-through opacity-60' : 'text-foreground'}`}>{block.title}</p>
                          <p className="text-xs text-muted-foreground">{block.duration} min</p>
                        </div>
                        {block.completed && <Zap className="h-4 w-4 text-xp" />}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">No study plan yet.</p>
                  <Link to="/onboarding" className="mt-2 inline-block text-sm text-primary hover:underline">
                    Create your learning plan →
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Active Goals + Recent Topics row */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-6">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <h2 className="font-display text-lg font-semibold text-foreground">Active Goals</h2>
                  </div>
                  <span className="text-xs text-muted-foreground">{activeGoals.length}</span>
                </div>
                {activeGoals.length > 0 ? (
                  <div className="space-y-2">
                    {activeGoals.slice(0, 3).map(g => (
                      <Link
                        key={g.id}
                        to={`/goal/${g.id}`}
                        className="block rounded-lg border border-border bg-muted/20 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/40"
                      >
                        <p className="truncate text-sm font-medium text-foreground">{g.description}</p>
                        <p className="text-xs text-muted-foreground">{g.mastery_level} • {g.duration_value} {g.duration_unit}</p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-sm text-muted-foreground">No active goals. <Link to="/goals" className="text-primary hover:underline">Create one →</Link></p>
                )}
              </motion.div>

              <motion.div {...fadeUp} transition={{ delay: 0.35 }} className="glass-card rounded-xl p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-highlight" />
                  <h2 className="font-display text-lg font-semibold text-foreground">Recent Topics</h2>
                </div>
                {recentTopics.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {recentTopics.map(t => (
                      <span key={t} className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-sm text-muted-foreground">No topics yet today. Start a session to begin.</p>
                )}
              </motion.div>
            </div>

            {/* Learning Heatmap */}
            <motion.div {...fadeUp} transition={{ delay: 0.4 }} className="glass-card rounded-xl p-6">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-streak" />
                  <h2 className="font-display text-lg font-semibold text-foreground">Learning Heatmap</h2>
                </div>
                <Link to="/memory" className="text-xs text-primary hover:underline">View memory →</Link>
              </div>
              <MiniHeatmap data={heatmap || new Map()} weeks={14} />
            </motion.div>

            {/* Recent Activity */}
            {recentActivity && recentActivity.length > 0 && (
              <motion.div {...fadeUp} transition={{ delay: 0.45 }} className="glass-card rounded-xl p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold text-foreground">Recent Sessions</h2>
                  <Link to="/memory" className="text-xs text-primary hover:underline">All →</Link>
                </div>
                <div className="space-y-2">
                  {recentActivity.map((activity) => (
                    <motion.div
                      key={activity.id}
                      whileHover={{ x: 2 }}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3 transition-colors hover:border-primary/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-md ${activity.type === 'session' ? 'bg-primary/10' : 'bg-xp/10'}`}>
                          {activity.type === 'session' ? <Timer className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-xp" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.meta || (activity.type === 'report' ? 'Daily Report' : '')}
                            {' • '}{new Date(activity.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-xp">+{activity.xp} XP</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Focus Score */}
            <motion.div {...fadeUp} transition={{ delay: 0.25 }} className="glass-card rounded-xl p-6">
              <h2 className="mb-3 font-display text-lg font-semibold text-foreground">Focus Score</h2>
              <FocusGauge
                score={focusScore?.score || 0}
                size={140}
                breakdown={focusScore ? {
                  consistency: focusScore.consistency,
                  completion: focusScore.completion,
                  interruption: focusScore.interruption,
                  proofQuality: focusScore.proofQuality,
                } : undefined}
              />
            </motion.div>

            {/* Quick Actions */}
            <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-6">
              <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Quick Actions</h2>
              <div className="space-y-2.5">
                {quickActions.map(a => (
                  <Link
                    key={a.to}
                    to={a.to}
                    className={`group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                      a.variant === 'primary'
                        ? 'bg-gradient-primary text-primary-foreground hover:scale-[1.02]'
                        : 'border border-border bg-muted/40 text-foreground hover:border-primary/40 hover:bg-muted/60'
                    }`}
                  >
                    <a.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                    <span className="flex-1">{a.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Level Progress */}
            <motion.div {...fadeUp} transition={{ delay: 0.35 }} className="glass-card rounded-xl p-6">
              <h2 className="mb-3 font-display text-lg font-semibold text-foreground">Level Progress</h2>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-level/10">
                  <TrendingUp className="h-6 w-6 text-level" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{profile?.level || 'Beginner'}</p>
                  <p className="text-xs text-muted-foreground">{(currentLevel.max - xp).toLocaleString()} XP to next</p>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-level"
                  initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: 0.6 }}
                />
              </div>
            </motion.div>

            {/* Community Activity */}
            <motion.div {...fadeUp} transition={{ delay: 0.4 }} className="glass-card rounded-xl p-6">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-highlight" />
                  <h2 className="font-display text-lg font-semibold text-foreground">Community</h2>
                </div>
                <Link to="/community" className="text-xs text-primary hover:underline">Open →</Link>
              </div>
              {recentPosts.length > 0 ? (
                <div className="space-y-2">
                  {recentPosts.map(p => (
                    <Link
                      key={p.id}
                      to="/community"
                      className="block rounded-lg border border-border bg-muted/20 px-3 py-2 transition-colors hover:border-primary/40"
                    >
                      <p className="truncate text-xs font-medium text-foreground">{p.title}</p>
                      <p className="text-[11px] text-muted-foreground">{p.post_type} • ▲ {p.upvotes}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent posts.</p>
              )}
            </motion.div>

            {/* Mentor Updates */}
            <motion.div {...fadeUp} transition={{ delay: 0.45 }} className="glass-card rounded-xl p-6">
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-semibold text-foreground">Mentor</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Connect with mentors for feedback on your reflections and proofs.
              </p>
              <Link
                to="/mentor"
                className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Open mentor dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
