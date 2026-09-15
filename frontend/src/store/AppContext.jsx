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
  const [studyPlans, setStudyPlans] = useState([]);
  const [topics, setTopics] = useState([]);
  const [testRecords, setTestRecords] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [energyCheckins, setEnergyCheckins] = useState([]);
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

  const loadStudyPlans = useCallback(async (uid) => {
    if (!uid) { setStudyPlans([]); return; }
    const { data } = await supabase
      .from('study_plans')
      .select('*')
      .eq('user_id', uid)
      .order('plan_date', { ascending: true })
      .order('sort_order', { ascending: true });
    if (data) setStudyPlans(data);
  }, []);

  const loadTopics = useCallback(async (uid) => {
    if (!uid) { setTopics([]); return; }
    const { data } = await supabase
      .from('topic_tracking')
      .select('*')
      .eq('user_id', uid)
      .order('subject', { ascending: true })
      .order('chapter', { ascending: true });
    if (data) setTopics(data);
  }, []);

  const loadTestRecords = useCallback(async (uid) => {
    if (!uid) { setTestRecords([]); return; }
    const { data } = await supabase
      .from('test_records')
      .select('*')
      .eq('user_id', uid)
      .order('taken_on', { ascending: false })
      .order('created_at', { ascending: false });
    if (data) setTestRecords(data);
  }, []);

  const loadStudySessions = useCallback(async (uid) => {
    if (!uid) { setStudySessions([]); return; }
    const { data } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', uid)
      .gte('started_at', dayjs().subtract(30, 'day').startOf('day').toISOString())
      .order('started_at', { ascending: false });
    if (data) setStudySessions(data);
  }, []);

  const loadEnergyCheckins = useCallback(async (uid) => {
    if (!uid) { setEnergyCheckins([]); return; }
    const { data } = await supabase
      .from('energy_checkins')
      .select('*')
      .eq('user_id', uid)
      .gte('created_at', dayjs().subtract(14, 'day').startOf('day').toISOString())
      .order('created_at', { ascending: false });
    if (data) setEnergyCheckins(data);
  }, []);

  const refreshAll = useCallback(async () => {
    setFeedBusy(true);
    await Promise.all([
      loadProfile(userId),
      loadStreak(userId),
      loadDaily(),
      loadTasks(userId),
      loadExams(userId),
      loadStudyPlans(userId),
      loadTopics(userId),
      loadTestRecords(userId),
      loadStudySessions(userId),
      loadEnergyCheckins(userId),
    ]);
    setFeedBusy(false);
  }, [userId, loadProfile, loadStreak, loadDaily, loadTasks, loadExams, loadStudyPlans, loadTopics, loadTestRecords, loadStudySessions, loadEnergyCheckins]);

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_plans' }, refreshAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'topic_tracking' }, refreshAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'test_records' }, refreshAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_sessions' }, refreshAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'energy_checkins' }, refreshAll)
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
      studyPlans,
      topics,
      testRecords,
      studySessions,
      energyCheckins,
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
      requestPasswordReset: (email) =>
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        }),
      updatePassword: (password) => supabase.auth.updateUser({ password }),
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
      addStudyPlan: async (payload) => {
        const { data, error } = await supabase
          .from('study_plans')
          .insert({ user_id: userId, ...payload })
          .select()
          .single();
        if (error) throw error;
        await loadStudyPlans(userId);
        return data;
      },
      updateStudyPlan: async (id, patch) => {
        const { data, error } = await supabase.from('study_plans').update(patch).eq('id', id).select().single();
        if (error) throw error;
        await loadStudyPlans(userId);
        return data;
      },
      deleteStudyPlan: async (id) => {
        const { error } = await supabase.from('study_plans').delete().eq('id', id);
        if (error) throw error;
        await loadStudyPlans(userId);
      },
      addTopic: async (payload) => {
        const { data, error } = await supabase
          .from('topic_tracking')
          .insert({ user_id: userId, ...payload })
          .select()
          .single();
        if (error) throw error;
        await loadTopics(userId);
        return data;
      },
      upsertTopic: async (payload) => {
        const { data, error } = await supabase
          .from('topic_tracking')
          .upsert({ user_id: userId, ...payload }, { onConflict: 'user_id,subject,chapter,topic' })
          .select()
          .single();
        if (error) throw error;
        await loadTopics(userId);
        return data;
      },
      updateTopic: async (id, patch) => {
        const { data, error } = await supabase.from('topic_tracking').update(patch).eq('id', id).select().single();
        if (error) throw error;
        await loadTopics(userId);
        return data;
      },
      deleteTopic: async (id) => {
        const { error } = await supabase.from('topic_tracking').delete().eq('id', id);
        if (error) throw error;
        await loadTopics(userId);
      },
      addTestRecord: async (payload) => {
        const { data, error } = await supabase
          .from('test_records')
          .insert({ user_id: userId, ...payload })
          .select()
          .single();
        if (error) throw error;
        await loadTestRecords(userId);
        return data;
      },
      updateTestRecord: async (id, patch) => {
        const { data, error } = await supabase.from('test_records').update(patch).eq('id', id).select().single();
        if (error) throw error;
        await loadTestRecords(userId);
        return data;
      },
      deleteTestRecord: async (id) => {
        const { error } = await supabase.from('test_records').delete().eq('id', id);
        if (error) throw error;
        await loadTestRecords(userId);
      },
      addStudySession: async (payload) => {
        const { data, error } = await supabase
          .from('study_sessions')
          .insert({ user_id: userId, auto: false, ...payload })
          .select()
          .single();
        if (error) throw error;
        await loadStudySessions(userId);
        return data;
      },
      commitStudySession: async (session) => {
        if (!session?.started_at) return null;
        const ended = new Date();
        const duration = Math.round((ended.getTime() - new Date(session.started_at).getTime()) / 1000);
        if (duration < 0) return null;
        const { data, error } = await supabase
          .from('study_sessions')
          .insert({ user_id: userId, duration_seconds: duration, started_at: session.started_at, ended_at: ended.toISOString(), subject: session.subject || null, auto: true })
          .select()
          .single();
        if (error) throw error;
        await loadStudySessions(userId);
        return data;
      },
      addEnergyCheckin: async (payload) => {
        const { data, error } = await supabase
          .from('energy_checkins')
          .insert({ user_id: userId, ...payload })
          .select()
          .single();
        if (error) throw error;
        await loadEnergyCheckins(userId);
        return data;
      },
      // Dynamic schedule shifting — when energy drops, move today's heavy
      // (hard-difficulty) plans + high-priority tasks a day later.
      shiftHeavyToday: async () => {
        if (!userId) return { plans: 0, tasks: 0 };
        const todayStr = dayjs().format('YYYY-MM-DD');
        const tomorrowStr = dayjs().add(1, 'day').format('YYYY-MM-DD');

        const { data: heavyPlans } = await supabase
          .from('study_plans')
          .select('id')
          .eq('user_id', userId)
          .eq('plan_date', todayStr)
          .eq('difficulty', 'hard')
          .eq('is_done', false);
        for (const p of heavyPlans || []) {
          await supabase.from('study_plans').update({ plan_date: tomorrowStr }).eq('id', p.id);
        }

        const start = dayjs().startOf('day').toISOString();
        const end = dayjs().endOf('day').toISOString();
        const { data: heavyTasks } = await supabase
          .from('tasks')
          .select('id, due_date')
          .eq('user_id', userId)
          .eq('priority', 1)
          .eq('is_completed', false)
          .gte('due_date', start)
          .lte('due_date', end);
        for (const t of heavyTasks || []) {
          const next = dayjs(t.due_date).add(1, 'day').toISOString();
          await supabase.from('tasks').update({ due_date: next }).eq('id', t.id);
        }

        await Promise.all([loadStudyPlans(userId), loadTasks(userId)]);
        return { plans: (heavyPlans || []).length, tasks: (heavyTasks || []).length };
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
      feedBusy, loadingAuth, commitStreak, studyPlans, topics, testRecords, studySessions, energyCheckins,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}