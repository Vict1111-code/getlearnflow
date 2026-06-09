import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Calls the DB maintenance function once per browser per day so that users
// who didn't submit a report yesterday have their streak decremented by 1.
export function useStreakMaintenance() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    const key = `learnflow:streak-check:${user.id}`;
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(key) === today) return;
    supabase.rpc('decrement_missed_streaks').then(({ error }) => {
      if (!error) localStorage.setItem(key, today);
    });
  }, [user?.id]);
}
