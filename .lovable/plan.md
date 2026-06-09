# LearnFlow Phase 1 Stabilization Plan

A targeted, non-redesign update. Keeps current navigation, layout, branding, and styling — only adds/fixes the items below.

---

## 1. Restore Daily Reports as a dedicated page

- Add **Daily Reports** back into primary navigation (Dashboard · Study · Goals · **Daily Reports** · Analysis · Community · AI Assistant · Profile) in `AppSidebar.tsx` and `MobileBottomNav.tsx`.
- Restore route `/report` → `DailyReport` page (already exists in `src/pages/DailyReport.tsx`); ensure it's wired and styled consistently.
- Add an **Auto-generate today's report** action that pulls:
  - Today's `study_sessions` (count, total minutes, topics, interruptions)
  - Today's `session_reflections` (learned/challenged/revise text)
  - Today's `learning_goals` updates (completed concepts)
  - Today's focus score (from `focus_integrity_scores`)
  - User notes (free-text field)
- Display computed fields: study time, sessions completed, focus score, completed goals, topics, distractions, reflections.
- On submit → insert into `daily_reports` and trigger streak update (see #2).

## 2. Streak rework (Daily-Report driven)

- New rule: streak increments **only when a daily report is submitted that day**.
- Missed day → `streak = max(0, streak - 1)` (no reset to 0).
- Implement via DB trigger on `daily_reports` insert: replace `update_user_streak` logic to compare `last_active_date` set from report dates.
- Add a daily background reconciliation (function `decrement_missed_streaks()`) callable on app load (client-triggered via edge function) to subtract 1 for users whose `last_active_date < CURRENT_DATE - 1`.
- Invalidate React Query caches for profile/streak after submission for instant Dashboard update.

## 3. Save-to-Library fix

- Audit `saved_resources` insert path in `AISuggestedResources.tsx` — surface insert errors with `toast.error`.
- Ensure `user_id` is set explicitly to `auth.uid()` client-side; check RLS policy allows `INSERT WITH CHECK (user_id = auth.uid())`.
- Add idempotency: unique `(user_id, url)` to prevent duplicates; show "Already saved" state.
- Library page: confirm search/filter/remove/favorite already work; add `is_favorite` toggle if missing (column exists per saved_resources schema with 16 cols — verify).

## 4. AI Assistant chat persistence (DB-backed)

- New tables:
  - `ai_chats(id, user_id, title, mode, pinned, favorite, created_at, updated_at)`
  - `ai_chat_messages(id, chat_id, user_id, role, content, attachments jsonb, created_at)`
- Update `AIAssistantContext.tsx` to load chats from DB on mount, write through on create/send/rename/delete.
- Keep localStorage as offline cache only.
- History sidebar grouping: Today / Yesterday / Previous 7 days / Older (by `updated_at`).
- Search by title/content client-side.

## 5. AI Reflection Analyzer

- Extend `session_reflections` with `ai_summary jsonb` (strengths, weak_areas, revision_topics, summary, next_step).
- On reflection submit → call `ai-assistant` (kind: `reflection`) and store structured result.
- Render the summary card inside Daily Reports, Session History, and Analysis.

## 6. Goal Detail persistence

- New table `goal_resource_suggestions(id, goal_id, user_id, payload jsonb, generated_at, effective_level)`.
- `AISuggestedResources` reads cached suggestions for the goal; only re-fetches on explicit **Refresh** click.
- Manual refresh button already exists — wire it to overwrite the cached row.
- Confirm React Query keys are stable per `goalId` and `staleTime` is generous.

## 7. Refresh-bug audit

- Confirm `queryClient` defaults: `refetchOnWindowFocus: false`, `refetchOnReconnect: false`, `refetchOnMount: false`, large `staleTime` (already set in `App.tsx`).
- Audit pages that override these with `refetch: true` or `enabled: true` re-fires.
- Audit `useEffect` deps that cause remount loops; verify no `visibilitychange` listeners trigger refetch.

## 8. XP rebalance (≈30% of current)

- Update `add_xp_on_session()` trigger: XP = `LEAST(duration_seconds/60/3, 20)` (was `/60, 60`).
- Update `add_xp_on_report` paths: scale `xp_earned` to 30% at write time, or update default in `daily_reports` insertion.
- Update achievement `xp_reward` values to 30%.
- Update community/streak XP rewards anywhere they're written.
- Do NOT mutate existing user XP; only new gains affected.

## 9. Study Session Recovery

- Add localStorage key `learnflow:active-session` containing `{sessionId, goal, topic, startedAt, lastTick, notes, distractions, draftReflection}`.
- In `StudyTimer.tsx`: write every 15s + on tab `beforeunload`.
- Timer derives elapsed from `Date.now() - startedAt - pausedMs` (not solely `setInterval`).
- On Dashboard mount, detect unfinished session and show recovery banner with **Resume / Save & finish / Discard**.
- Sync to DB: on each autosave also `UPDATE study_sessions SET notes, interruptions, updated_at WHERE id=?`.

## 10. App-wide error scan

- Run typecheck (auto), check console/network for runtime errors, fix broken imports/dead links exposed by IA changes.

---

## Technical sections

### Migrations
1. `ai_chats`, `ai_chat_messages` (+ RLS, GRANTs).
2. `goal_resource_suggestions` (+ RLS, GRANTs).
3. `saved_resources` unique `(user_id, url)` + ensure `is_favorite boolean default false`.
4. `session_reflections.ai_summary jsonb`.
5. Replace `update_user_streak` trigger; new `decrement_missed_streaks()` SECURITY DEFINER fn.
6. Update `add_xp_on_session` for new XP scale; update achievement rewards.

### Files to add/edit (high level)
- Add: `src/components/study/SessionRecoveryBanner.tsx`, `src/hooks/useSessionRecovery.ts`, `src/hooks/useAutoDailyReport.ts`.
- Edit: `AppSidebar.tsx`, `MobileBottomNav.tsx`, `App.tsx`, `DailyReport.tsx`, `Index.tsx` (banner), `AIAssistantContext.tsx`, `AISuggestedResources.tsx`, `GoalDetail.tsx`, `StudyTimer.tsx`, `ReflectionModal.tsx`, `Library.tsx`, edge fn `ai-assistant`.

### Out of scope
- Visual redesign, new color/typography, new navigation patterns beyond restoring Daily Reports.

---

Approve and I'll execute migrations first (you'll review each), then ship the code changes in batches with verification at each step.