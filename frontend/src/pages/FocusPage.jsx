import { useEffect, useMemo, useRef, useState } from 'react';
import PageShell from '../components/layout/PageShell';
import { useApp } from '../store/AppContext';
import { formatDuration, LOCAL_DATE, TODAY } from '../lib/utils';
import { taskDoneMessage } from '../lib/motivation';

export default function FocusPage() {
  const { studySessions, tasks, commitStudySession } = useApp();
  const [activeSession, setActiveSession] = useState(null); // { subject, started_at, taskId }
  const [subject, setSubject] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [savedNotice, setSavedNotice] = useState('');
  const ivRef = useRef(null);

  const uniqueSubjects = useMemo(() => {
    const set = new Set();
    for (const t of tasks) if (t.subject) set.add(t.subject);
    for (const s of studySessions) if (s.subject) set.add(s.subject);
    return [...set].sort();
  }, [tasks, studySessions]);

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

  useEffect(() => {
    if (activeSession) {
      setElapsed(0);
      ivRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - new Date(activeSession.started_at).getTime()) / 1000));
      }, 1000);
      return () => clearInterval(ivRef.current);
    }
    if (ivRef.current) { clearInterval(ivRef.current); ivRef.current = null; }
    setElapsed(0);
  }, [activeSession]);

  const start = () => {
    setActiveSession({ subject: subject.trim() || 'General', started_at: new Date().toISOString(), taskId: null });
  };

  const stop = async () => {
    if (!activeSession) return;
    try {
      await commitStudySession(activeSession);
      setSavedNotice(taskDoneMessage());
      setTimeout(() => setSavedNotice(''), 4000);
    } catch {
      /* swallow */
    }
    setActiveSession(null);
  };

  return (
    <PageShell title="Focus" subtitle="Study timer & time tracker">
      <div className="px-4 py-5 space-y-5 animate-pop">
        {/* Timer card */}
        <div className="rounded-2xl bg-surface-dark p-6 ring-1 ring-surface text-center">
          <p className="mb-4 text-[13px] text-muted">{activeSession ? `Focusing on ${activeSession.subject}` : 'Ready to study'}</p>

          <div className="mb-6 text-5xl font-bold tracking-tight font-mono text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {String(Math.floor(elapsed / 3600)).padStart(2, '0')}:{String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
          </div>

          {activeSession ? (
            <div className="flex justify-center gap-3">
              <button type="button" onClick={stop} className="btn-primary px-8 py-3 text-sm">
                ⏹ Save session
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  className="input-round flex-1"
                  placeholder="Subject (optional)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  list="focus-subjects"
                />
                <datalist id="focus-subjects">
                  {uniqueSubjects.map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>
              <button type="button" onClick={start} className="btn-primary w-full py-3 text-sm">
                ▶ Start focus
              </button>
            </div>
          )}
        </div>

        {savedNotice && (
          <div className="rounded-lg bg-brand-light/15 px-3 py-2 text-[13px] text-brand-lighter">{savedNotice}</div>
        )}

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