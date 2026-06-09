
-- ============================================================
-- 1) AI chat persistence
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New chat',
  mode text NOT NULL DEFAULT 'explain',
  pinned boolean NOT NULL DEFAULT false,
  favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_chats TO authenticated;
GRANT ALL ON public.ai_chats TO service_role;
ALTER TABLE public.ai_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their ai chats" ON public.ai_chats
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS ai_chats_user_updated_idx ON public.ai_chats (user_id, updated_at DESC);
CREATE TRIGGER ai_chats_updated_at BEFORE UPDATE ON public.ai_chats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.ai_chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  attachments jsonb,
  mode text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_chat_messages TO authenticated;
GRANT ALL ON public.ai_chat_messages TO service_role;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their ai chat messages" ON public.ai_chat_messages
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS ai_chat_messages_chat_idx ON public.ai_chat_messages (chat_id, created_at);

-- ============================================================
-- 2) Goal resource suggestions cache
-- ============================================================
CREATE TABLE IF NOT EXISTS public.goal_resource_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.learning_goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  effective_level text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, goal_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goal_resource_suggestions TO authenticated;
GRANT ALL ON public.goal_resource_suggestions TO service_role;
ALTER TABLE public.goal_resource_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their goal resource cache" ON public.goal_resource_suggestions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 3) Saved resources: favorite flag
-- ============================================================
ALTER TABLE public.saved_resources
  ADD COLUMN IF NOT EXISTS favorite boolean NOT NULL DEFAULT false;

-- ============================================================
-- 4) Session reflections: AI summary
-- ============================================================
ALTER TABLE public.session_reflections
  ADD COLUMN IF NOT EXISTS ai_summary jsonb;

-- ============================================================
-- 5) Daily reports: new fields + default XP reduced (30%)
-- ============================================================
ALTER TABLE public.daily_reports
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS topics text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS distractions_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS goals_completed integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS focus_score numeric,
  ADD COLUMN IF NOT EXISTS focus_seconds integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sessions_count integer NOT NULL DEFAULT 0,
  ALTER COLUMN xp_earned SET DEFAULT 15;

-- ============================================================
-- 6) Streak rework — drive entirely from daily_reports
-- ============================================================

-- Remove the old session-driven streak trigger
DROP TRIGGER IF EXISTS on_study_session_streak ON public.study_sessions;
DROP TRIGGER IF EXISTS update_streak_on_session ON public.study_sessions;
DROP TRIGGER IF EXISTS study_session_streak_trg ON public.study_sessions;

CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_date DATE;
  cur_streak INTEGER;
  report_day DATE := NEW.report_date;
BEGIN
  SELECT last_active_date, COALESCE(streak,0)
    INTO last_date, cur_streak
  FROM public.profiles WHERE user_id = NEW.user_id;

  IF last_date IS NULL THEN
    UPDATE public.profiles
      SET streak = 1, last_active_date = report_day
      WHERE user_id = NEW.user_id;
  ELSIF report_day = last_date THEN
    -- second insert same day, no-op
    NULL;
  ELSIF report_day = last_date + 1 THEN
    UPDATE public.profiles
      SET streak = cur_streak + 1, last_active_date = report_day
      WHERE user_id = NEW.user_id;
  ELSIF report_day > last_date + 1 THEN
    -- gap: subtract for each missed day, floor at 0, then count today as 1
    UPDATE public.profiles
      SET streak = GREATEST(0, cur_streak - (report_day - last_date - 1)) + 1,
          last_active_date = report_day
      WHERE user_id = NEW.user_id;
  ELSE
    -- backdated report; just update last_active_date if earlier
    UPDATE public.profiles SET last_active_date = GREATEST(last_active_date, report_day)
      WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Maintenance function callable by the client/edge: decrement streaks for users
-- whose last_active_date < yesterday. Idempotent per day via last_active_date push.
CREATE OR REPLACE FUNCTION public.decrement_missed_streaks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
    SET streak = GREATEST(0, COALESCE(streak,0) - (CURRENT_DATE - last_active_date - 1)),
        last_active_date = CURRENT_DATE - 1
    WHERE last_active_date IS NOT NULL
      AND last_active_date < CURRENT_DATE - 1
      AND COALESCE(streak,0) > 0;
END;
$$;

-- ============================================================
-- 7) XP rebalance — sessions to ~30% (1 XP / 3 min, max 20)
-- ============================================================
CREATE OR REPLACE FUNCTION public.add_xp_on_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
    NEW.xp_earned := LEAST(GREATEST(NEW.duration_seconds / 180, 0), 20);
    PERFORM public.add_xp_to_user(NEW.user_id, NEW.xp_earned);
  END IF;
  RETURN NEW;
END;
$$;

-- Achievement rewards ~30%
UPDATE public.achievements SET xp_reward = ROUND(xp_reward * 0.3) WHERE xp_reward > 0;
