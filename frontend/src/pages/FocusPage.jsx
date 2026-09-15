import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import { useApp } from '../store/AppContext';
import { formatDuration, LOCAL_DATE, TODAY } from '../lib/utils';
import { taskDoneMessage, unlockCheerMessage } from '../lib/motivation';
import { sprintConfig, subjectDifficulty } from '../lib/sprints';
import { totalFocusMinutes, newUnlocks, nextUnlock, unlockMessage } from '../lib/unlocks';

const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function FocusPage() {
  const { studySessions, tasks, topics, profile, commitStudySession, updateProfile } = useApp();
  const [mode, setMode] = useState('sprint');
  const [subject, setSubject] = useState('');
  const [phase, setPhase] = useState('idle'); // sprint: work|break|longbreak|idle; free: active|idle
  const [remaining, setRemaining] = useState(0);
  const [round, setRound] = useState(0);
  const [notice, setNotice] = useState('');
  const [unlockNotice, setUnlockNotice] = useState('');
  const endRef = useRef(null);
  const workStartRef = useRef(null);

  const uniqueSubjects = useMemo(() => {
    const set = new Set();
    for (const t of tasks) if (t.subject) set.add(t.subject);
    for (const s of studySessions) if (s.subject) set.add(s.subject);
    return [...set].sort();
  }, [tasks, studySessions]);

  const cfg = mode === 'sprint' ? sprintConfig(subject, topics) : null;
  const difficulty = mode === 'sprint' ? subjectDifficulty(subject, topics) : null;

  const todayTotal = useMemo(() => {
    const today = TODAY();
    return studySessions
      .filter((s) => LOCAL_DATE(s.started_at) === today && s.duration_seconds > 0)
      .reduce((a, s) => a + s.duration_seconds, 0);
  }, [studySessions]);

  const bySubjectToday = useMemo(() => {
    const map = {};
    const today = TODAY();
    for (const s of studySessions) {
      if (LOCAL_DATE(s.started_at) !== today || s.duration_seconds <= 0) continue;
      const sub = s.subject || 'General';
      map[sub] = (map[sub] || 0) + s.duration_seconds;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [studySessions]);

  const recentSessions = useMemo(() => studySessions.slice(0, 20), [studySessions]);

  const totalMins = useMemo(() => totalFocusMinutes(studySessions), [studySessions]);
  const upNext = nextUnlock(profile, studySessions);

  // Mascot cosmetic unlocks — earn on crossing focus-time milestones.
  const unlocks = useMemo(() => newUnlocks(profile, studySessions), [profile, totalMins]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (unlocks.length === 0) return;
    const merged = [...new Set([...(profile?.unlocks || []), ...unlocks.map((u) => u.id)])];
    updateProfile({ unlocks: merged }).catch(() => {});
    setUnlockNotice(unlocks.map((u) => `${unlockMessage(u)} ${unlockCheerMessage(u.name)}`).join(' '));
    const iv = setTimeout(() => setUnlockNotice(''), 8000);
    return () => clearTimeout(iv);
  }, [unlocks.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const flash = (msg) => {
    setNotice(msg);
    const iv = setTimeout(() => setNotice(''), 4000);
    return iv;
  };

  // Countdown / elapsed driver.
  useEffect(() => {
    if (phase === 'idle') return undefined;
    const iv = setInterval(() => {
      if (phase === 'active') {
        const elapsed = workStartRef.current
          ? Math.round((Date.now() - new Date(workStartRef.current).getTime()) / 1000)
          : 0;
        setRemaining(elapsed);
        return;
      }
      const left = Math.round((endRef.current - Date.now()) / 1000);
      setRemaining(left <= 0 ? 0 : left);
    }, 250);
    return () => clearInterval(iv);
  }, [phase]);

  const showPhase = (label) => setNotice(label);

  const commitWork = async (startedAt) => {
    if (!startedAt) return;
    try {
      await commitStudySession({ subject: subject.trim() || 'General', started_at: startedAt });
    } catch { /* swallow */ }
  };

  const nextPhase = async () => {
    if (phase === 'work') {
      await commitWork(workStartRef.current);
      workStartRef.current = null;
      const completed = round + 1;
      setRound(completed);
      if (completed % cfg.rounds === 0) {
        flash(taskDoneMessage());
        setPhase('longbreak');
        endRef.current = Date.now() + cfg.longBrk * 60000;
        setRemaining(cfg.longBrk * 60);
        showPhase(`Round ${completed} done — long break, take a real breather.`);
      } else {
        flash(taskDoneMessage());
        setPhase('break');
        endRef.current = Date.now() + cfg.brk * 60000;
        setRemaining(cfg.brk * 60);
        showPhase(`Round ${completed} done — ${cfg.brk} min break.`);
      }
      return;
    }
    if (phase === 'break' || phase === 'longbreak') {
      if (phase === 'longbreak') setRound(0);
      setPhase('work');
      workStartRef.current = new Date().toISOString();
      endRef.current = Date.now() + cfg.study * 60000;
      setRemaining(cfg.study * 60);
      showPhase('Focus time — eyes on the prize.');
      return;
    }
  };

  useEffect(() => {
    if (phase === 'idle' || phase === 'active') return undefined;
    if (remaining > 0) return undefined;
    nextPhase();
  }, [remaining, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const startSprint = () => {
    setRound(0);
    setPhase('work');
    workStartRef.current = new Date().toISOString();
    endRef.current = Date.now() + cfg.study * 60000;
    setRemaining(cfg.study * 60);
  };

  const avoidSprint = () => {
    setPhase('idle');
    workStartRef.current = null;
    endRef.current = null;
    setRemaining(0);
  };

  // Free mode.
  const startFree = () => {
    workStartRef.current = new Date().toISOString();
    setPhase('active');
  };
  const stopFree = async () => {
    if (phase === 'active') {
      await commitWork(workStartRef.current);
      flash(taskDoneMessage());
    }
    workStartRef.current = null;
    setPhase('idle');
    setRemaining(0);
  };

  const totalSecondsLeft = remaining;
  const isActive = phase === 'work' || phase === 'active';
  const phaseLabel =
    phase === 'work' ? `focus (round ${round + 1}/${cfg.rounds})`
      : phase === 'break' ? 'break'
        : phase === 'longbreak' ? 'long break'
          : phase === 'active' ? 'free focus' : 'ready';

  return (
    <PageShell title="Focus" subtitle="Smart study sprints & time tracker">
      <div className="px-4 py-5 space-y-5 animate-pop">
        {/* Timer card */}
        <div className="rounded-2xl bg-surface-dark p-6 ring-1 ring-surface text-center">
          <div className="mb-3 flex justify-center gap-2">
            <button type="button" onClick={() => { setMode('sprint'); setPhase('idle'); }} className={`chip ${mode === 'sprint' ? 'bg-brand-light/30 ring-1 ring-brand-lighter text-brand-lighter' : 'bg-surface text-soft'}`}>
              ⚡ Sprints
            </button>
            <button type="button" onClick={() => { setMode('free'); setPhase('idle'); }} className={`chip ${mode === 'free' ? 'bg-brand-light/30 ring-1 ring-brand-lighter text-brand-lighter' : 'bg-surface text-soft'}`}>
              🕒 Free focus
            </button>
          </div>

          <p className="mb-4 text-[13px] text-muted">
            {mode === 'sprint'
              ? `${difficulty} difficulty · ${cfg.study} min sprint / ${cfg.brk} min break · 4 rounds = long break`
              : 'Free focus — run as long as you like, save when done.'}
          </p>

          <div className="mb-6 text-5xl font-bold tracking-tight font-mono text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {fmt(totalSecondsLeft)}
          </div>

          <div className="mb-3 flex gap-2">
            <input
              className="input-round flex-1"
              placeholder="Subject (auto-detects difficulty)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              list="focus-subjects"
              disabled={isActive}
            />
            <datalist id="focus-subjects">
              {uniqueSubjects.map((s) => <option key={s} value={s} />)}
            </datalist>
            <button
              type="button"
              onClick={() => { setSubject(''); setPhase('idle'); }}
              disabled={isActive}
              className="btn-secondary px-3 text-sm"
              title="Clear subject"
            >
              ✕
            </button>
          </div>

          {mode === 'sprint' && !isActive && phase !== 'break' && phase !== 'longbreak' && (
            <button type="button" onClick={startSprint} className="btn-primary w-full py-3 text-sm">▶ Start {cfg.study}-min sprint</button>
          )}
          {mode === 'sprint' && (phase === 'break' || phase === 'longbreak') && (
            <button type="button" onClick={() => nextPhase()} className="btn-primary w-full py-3 text-sm">Skip break → focus</button>
          )}
          {mode === 'free' && phase === 'idle' && (
            <button type="button" onClick={startFree} className="btn-primary w-full py-3 text-sm">▶ Start focus</button>
          )}
          {isActive && (
            <div className="flex justify-center gap-3">
              {mode === 'free' ? (
                <button type="button" onClick={stopFree} className="btn-primary px-8 py-3 text-sm">⏹ Save session</button>
              ) : (
                <>
                  <button type="button" onClick={avoidSprint} className="btn-danger px-5 py-3 text-sm">⏹ Stop</button>
                  <button type="button" onClick={() => nextPhase()} className="btn-secondary px-5 py-3 text-sm">Finish round early</button>
                </>
              )}
            </div>
          )}

          <p className="mt-3 text-[11.5px] text-muted">status: {phaseLabel}</p>
        </div>

        {notice && (
          <div className="rounded-lg bg-brand-light/15 px-3 py-2 text-[13px] text-brand-lighter">{notice}</div>
        )}
        {unlockNotice && (
          <div className="rounded-lg bg-surface-light px-3 py-2 text-[13px] text-soft">{unlockNotice}</div>
        )}

        {/* Mascot progression */}
        <div className="rounded-xl bg-surface-dark p-4 ring-1 ring-surface">
          <div className="flex items-center justify-between">
            <p className="font-medium text-white">Mascot progression</p>
            <span className="text-2xl font-bold text-brand-lighter">{totalMins} min</span>
          </div>
          <p className="mb-2 text-[12px] text-muted">Total focused time feeds my cosmetic closet 🦉</p>
          {upNext ? (
            <div className="mb-2">
              <div className="flex justify-between text-[11.5px]">
                <span className="text-muted">Next unlock: {upNext.emoji} {upNext.name}</span>
                <span className="text-soft">{Math.min(100, Math.round((totalMins / upNext.mins) * 100))}%</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-ink">
                <div className="h-full rounded-full bg-brand-lighter" style={{ width: `${Math.min(100, (totalMins / upNext.mins) * 100)}%` }} />
              </div>
            </div>
          ) : (
            <p className="text-[12.5px] text-brand-lighter">All cosmetics unlocked — you are a full-blown scholar. 👑</p>
          )}
          <Link to="/settings" className="inline-block text-[12.5px] text-brand-lighter">Open mascot closet →</Link>
        </div>

        {/* Today's totals */}
        <div className="rounded-xl bg-surface-dark p-4 ring-1 ring-surface">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-medium text-white">Today's study time</p>
            <span className="text-2xl font-bold text-brand-lighter">{formatDuration(todayTotal)}</span>
          </div>
          {bySubjectToday.length === 0 && <p className="text-[13px] text-muted">No sessions yet today. Hit start to begin!</p>}
          <div className="space-y-2">
            {bySubjectToday.map(([sub, secs]) => (
              <div key={sub}>
                <div className="flex justify-between text-[11.5px]">
                  <span className="text-muted">{sub}</span>
                  <span className="text-soft">{formatDuration(secs)}</span>
                </div>
                <div className="mt-0.5 h-2 w-full overflow-hidden rounded-full bg-ink">
                  <div
                    className="h-full rounded-full bg-brand-lighter"
                    style={{ width: `${Math.min(100, (secs / Math.max(todayTotal, 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent sessions */}
        <div className="rounded-xl bg-surface-dark p-4 ring-1 ring-surface">
          <p className="mb-3 font-medium text-white">Recent sessions</p>
          {recentSessions.length === 0 && <p className="text-[13px] text-muted">Your completed focus sessions will appear here.</p>}
          <div className="space-y-1.5">
            {recentSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
                <div>
                  <p className="text-[13.5px] font-medium text-white">{s.subject || 'General'}</p>
                  <p className="text-[11px] text-muted">{LOCAL_DATE(s.started_at)}</p>
                </div>
                <span className="text-[14px] font-semibold text-brand-lighter">{formatDuration(s.duration_seconds)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}