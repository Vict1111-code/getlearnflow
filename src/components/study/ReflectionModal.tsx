import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Brain, Zap, Smile } from 'lucide-react';
import { upsertSessionReflection, updateSessionTags } from '@/lib/database';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReflectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
  userId: string | null;
  initialTags?: string[];
  durationSeconds: number;
  topic: string;
  onSaved?: () => void;
}

const MOODS = [
  { value: 'energized', label: 'Energized', emoji: '⚡' },
  { value: 'focused', label: 'Focused', emoji: '🎯' },
  { value: 'okay', label: 'Okay', emoji: '🙂' },
  { value: 'tired', label: 'Tired', emoji: '😴' },
  { value: 'frustrated', label: 'Frustrated', emoji: '😤' },
];

export default function ReflectionModal({
  open, onOpenChange, sessionId, userId,
  initialTags = [], durationSeconds, topic, onSaved,
}: ReflectionModalProps) {
  const [learned, setLearned] = useState('');
  const [challenged, setChallenged] = useState('');
  const [revise, setRevise] = useState('');
  const [focus, setFocus] = useState(4);
  const [distractions, setDistractions] = useState('');
  const [mood, setMood] = useState('focused');
  const [tagInput, setTagInput] = useState(initialTags.join(', '));
  const [saving, setSaving] = useState(false);

  const minutes = Math.round(durationSeconds / 60);

  const handleSave = async (skip = false) => {
    if (!sessionId || !userId) {
      onOpenChange(false);
      onSaved?.();
      return;
    }
    setSaving(true);
    try {
      const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
      if (tags.length > 0) await updateSessionTags(sessionId, tags);
      if (!skip) {
        const saved = await upsertSessionReflection({
          session_id: sessionId,
          user_id: userId,
          learned: learned || null,
          challenged: challenged || null,
          revise: revise || null,
          focus_rating: focus,
          distractions: distractions || null,
          mood,
          tags,
        });
        toast.success('Reflection saved — generating coaching summary…');
        // Fire-and-forget AI analysis; we don't block the modal close on it.
        supabase.functions.invoke('ai-assistant', {
          body: {
            kind: 'reflection',
            payload: {
              topic, minutes,
              focus_rating: focus, mood,
              learned, challenged, revise, distractions,
            },
          },
        }).then(async ({ data, error }) => {
          if (error || !data?.output) return;
          await supabase.from('session_reflections').update({ ai_summary: data.output }).eq('id', (saved as any).id);
        }).catch(() => { /* best-effort */ });
      }
      onOpenChange(false);
      onSaved?.();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save reflection');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-h-[90vh] max-w-2xl overflow-y-auto border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Session reflection
          </DialogTitle>
          <DialogDescription>
            {minutes} min on <span className="text-foreground">{topic || 'General Study'}</span> — capture it while it's fresh.
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5 pt-2"
        >
          <Field
            icon={<Brain className="h-4 w-4 text-primary" />}
            label="What did you learn?"
            value={learned}
            onChange={setLearned}
            placeholder="Key insights, ideas, or skills picked up..."
          />
          <Field
            icon={<Zap className="h-4 w-4 text-streak" />}
            label="What challenged you?"
            value={challenged}
            onChange={setChallenged}
            placeholder="Concepts that felt tough or confusing..."
          />
          <Field
            label="What should you revise?"
            value={revise}
            onChange={setRevise}
            placeholder="Topics to revisit tomorrow or this week..."
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Focus rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setFocus(n)}
                  className={`h-10 flex-1 rounded-lg border text-sm font-semibold transition-all ${
                    focus >= n
                      ? 'border-primary/60 bg-gradient-primary text-primary-foreground shadow-glow-primary'
                      : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Smile className="h-4 w-4" /> Mood
            </label>
            <div className="flex flex-wrap gap-2">
              {MOODS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(m.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    mood === m.value
                      ? 'border-primary/60 bg-primary/15 text-primary'
                      : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="mr-1">{m.emoji}</span>{m.label}
                </button>
              ))}
            </div>
          </div>

          <Field
            label="Distractions"
            value={distractions}
            onChange={setDistractions}
            placeholder="What pulled you away from focus?"
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Tags</label>
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              placeholder="comma, separated, tags (e.g. golang, pointers)"
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">Used to search your learning memory later.</p>
          </div>
        </motion.div>

        <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => handleSave(true)} disabled={saving}>
            Skip for now
          </Button>
          <Button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          >
            {saving ? 'Saving...' : 'Save reflection'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ icon, label, value, onChange, placeholder }: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
        {icon} {label}
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={2}
        placeholder={placeholder}
        className="w-full resize-none rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}
