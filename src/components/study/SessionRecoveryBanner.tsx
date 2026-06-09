import { Link } from 'react-router-dom';
import { Timer, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'learnflow:study-timer';

interface Persisted {
  state?: 'idle' | 'running' | 'paused';
  startedAt?: number | null;
  accumulated?: number;
  sessionId?: string | null;
  topic?: string;
}

export default function SessionRecoveryBanner() {
  const [data, setData] = useState<Persisted | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const p: Persisted = JSON.parse(raw);
      if (p?.state && p.state !== 'idle' && p.sessionId) setData(p);
    } catch { /* ignore */ }
  }, []);

  if (!data) return null;

  const elapsed = (data.accumulated || 0) + (data.state === 'running' && data.startedAt
    ? Math.floor((Date.now() - data.startedAt) / 1000) : 0);
  const minutes = Math.round(elapsed / 60);

  const discard = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="glass-card flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
          <Timer className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            You have an unfinished study session
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {data.topic || 'Untitled'} · {minutes} min so far
          </p>
        </div>
        <Link
          to="/study"
          className="rounded-lg bg-gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          Resume
        </Link>
        <button
          onClick={discard}
          aria-label="Dismiss"
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
