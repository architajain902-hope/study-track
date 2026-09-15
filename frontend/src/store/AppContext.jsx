import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase, API_URL } from '../lib/supabase';
import { kolkataDateStr, kolkataYesterdayStr, kolkataDayStartISO } from '../lib/utils';
import dayjs from 'dayjs';

const AppContext = createContext(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

const EMPTY_DAILY = { completed: 0, goal: 3 };

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [exams, setExams] = useState([]);
  const [streak, setStreak] = useState(null);
  const [daily, setDaily] = useState(EMPTY_DAILY);
  const [notifications, setNotifications] = useState([]);
  const [feedBusy, setFeedBusy] = useState(true);

  const userId = session?.user?.id;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoadingAuth(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadProfile = useCallback(async (uid) => {
    if (!uid) { setProfile(null); return; }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();
    if (error) {
      // Profile may not exist yet (e.g. rows created before triggers); insert lazily.
      if (error.code === 'PGRST116') {
        const { data: created } = await supabase
          .from('profiles')
          .insert({ id: uid, full_name: '' })
          .select()
          .single();
        setProfile(created);
      }
    } else {
      setProfile(data);
    }
  }, []);

  const loadStreak = useCallback(async (uid) => {
    if (!uid) { setStreak(null); return; }
    const { data } = await supabase.from('streaks').select('*').eq('user_id', uid).maybeSingle();
    if (data) setStreak(data);
  }, []);

  const loadDaily = useCallback(async () => {
    if (!userId) { setDaily(EMPTY_DAILY); return; }
    const [countRes, goalRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_completed', true)
        .gte('completed_at', kolkataDayStartISO()),
      supabase.from('profiles').select('daily_goal').eq('id', userId).maybeSingle(),
    ]);
    setDaily({
      completed: countRes.count ?? 0,
      goal: goalRes.data?.daily_goal ?? 3,
    });
  }, [userId]);

  const loadTasks = useCallback(async (uid) => {
    if (!uid) { setTasks([]); return; }
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (data) {
      setTasks(data);
      const today = dayjs().startOf('day').toISOString();
      const upcoming = data.filter(
        (t) => !t.is_completed && t.due_date && dayjs(t.due_date).valueOf() <= dayjs(today).add(7, 'day').valueOf()
      );
      if (upcoming.length) setNotifications((n) => {
        const next = n.filter((x) => x.kind !== 'task_due');
        return [...next, ...upcoming.map((t) => ({ kind: 'task_due', task: t }))];
      });
    }
  }, []);

  const loadExams = useCallback(async (uid) => {
    if (!uid) { setExams([]); return; }
    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('user_id', uid)
      .order('exam_date', { ascending: true });
    if (data) {
      setExams(data);
      const upcoming = data.filter(
        (e) => dayjs(e.exam_date).valueOf() >= dayjs().valueOf() && dayjs(e.exam_date).valueOf() <= dayjs().add(7, 'day').valueOf()
      );
      if (upcoming.length) setNotifications((n) => {
        const next = n.filter((x) => x.kind !== 'exam_upcoming');
        return [...next, ...upcoming.map((e) => ({ kind: 'exam_upcoming', exam: e }))];
      });
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setFeedBusy(true);
    await Promise.all([
      loadProfile(userId),
      loadStreak(userId),
      loadDaily(),
      loadTasks(userId),
      loadExams(userId),
    ]);
    setFeedBusy(false);
  }, [userId, loadProfile, loadStreak, loadDaily, loadTasks, loadExams]);

  useEffect(() => {
    if (session) refreshAll();
    else setFeedBusy(false);
  }, [session, refreshAll]);

  // Realtime subscriptions — sync open clients instantly when data changes.
  useEffect(() => {
    if (!userId) return undefined;
    const channel = supabase
      .channel('shared-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, refreshAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, refreshAll)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'streaks' }, () => loadStreak(userId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadProfile(userId);
        loadDaily();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [userId, refreshAll, loadProfile, loadStreak, loadDaily]);

  const commitStreak = useCallback(async () => {
    if (!userId) return null;
    const { data, error } = await supabase.rpc('commit_daily_goal');
    if (error) throw error;
    setStreak((s) => ({ ...s, current_streak: data, best_streak: Math.max(s?.best_streak ?? data, data), last_completed_date: kolkataDateStr() }));
    await Promise.all([loadDaily(), loadStreak(userId)]);
    return data;
  }, [userId, loadDaily, loadStreak]);

  // Active streak = 0 if the last completion day was before yesterday (Kolkata).
  const activeStreak = useMemo(() => {
    if (!streak || !streak.current_streak || !streak.last_completed_date) return 0;
    const [today, yesterday] = [kolkataDateStr(), kolkataYesterdayStr()];
    return (streak.last_completed_date === today || streak.last_completed_date === yesterday)
      ? streak.current_streak
      : 0;
  }, [streak]);

  const value = useMemo(
    () => ({
      session,
      userId,
      profile,
      tasks,
      exams,
      streak,
      activeStreak,
      daily,
      notifications,
      feedBusy,
      loadingAuth,
      login: (email, password) => supabase.auth.signInWithPassword({ email, password }),
      signup: (email, password, fullName) =>
        supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } }),
      logout: () => supabase.auth.signOut(),
      addTask: async (payload) => {
        const { data, error } = await supabase
          .from('tasks')
          .insert({ user_id: userId, ...payload })
          .select()
          .single();
        if (error) throw error;
        await loadTasks(userId);
        return data;
      },
      updateTask: async (id, patch) => {
        const { data, error } = await supabase.from('tasks').update(patch).eq('id', id).select().single();
        if (error) throw error;
        await loadTasks(userId);
        return data;
      },
      toggleTask: async (task) => {
        const completing = !task.is_completed;
        const patch = completing
          ? { is_completed: true, completed_at: new Date().toISOString() }
          : { is_completed: false, completed_at: null };
        const { error } = await supabase.from('tasks').update(patch).eq('id', task.id);
        if (error) throw error;
        if (completing) {
          try { await commitStreak(); } catch { /* streak is best-effort */ }
        }
        await loadTasks(userId);
      },
      deleteTask: async (id) => {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) throw error;
        await loadTasks(userId);
      },
      addExam: async (payload) => {
        const { data, error } = await supabase
          .from('exams')
          .insert({ user_id: userId, ...payload })
          .select()
          .single();
        if (error) throw error;
        await loadExams(userId);
        return data;
      },
      updateExam: async (id, patch) => {
        const { data, error } = await supabase.from('exams').update(patch).eq('id', id).select().single();
        if (error) throw error;
        await loadExams(userId);
        return data;
      },
      deleteExam: async (id) => {
        const { error } = await supabase.from('exams').delete().eq('id', id);
        if (error) throw error;
        await loadExams(userId);
      },
      updateProfile: async (patch) => {
        const { data, error } = await supabase.from('profiles').update(patch).eq('id', userId).select().single();
        if (error) throw error;
        setProfile(data);
        await loadDaily();
        return data;
      },
      commitStreak,
      fetchNotifications: async () => {
        try {
          const token = (await supabase.auth.getSession()).data.session?.access_token;
          const res = await fetch(`${API_URL}/api/notifications`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const body = await res.json();
            if (body?.notifications?.length) setNotifications(body.notifications);
          }
        } catch { /* backend optional */ }
      },
    }),
    [
      session, userId, profile, tasks, exams, streak, activeStreak, daily, notifications,
      feedBusy, loadingAuth, commitStreak,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}