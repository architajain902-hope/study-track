import { useState } from 'react';
import Modal from '../ui/Modal';
import { useApp } from '../../store/AppContext';
import { TODAY, LOCAL_DATE } from '../../lib/utils';
import { lowEnergyRestMessage } from '../../lib/motivation';

const LEVEL_STYLE = (v) =>
  v <= 3
    ? { bg: 'rgb(var(--danger))', color: '#fff' }
    : v <= 6
      ? { bg: 'rgb(var(--warn))', color: '#1c1c1c' }
      : { bg: 'rgb(var(--brand-lighter))', color: '#1c1c1c' };

const MOODS = [
  { v: 'energized', emoji: '⚡' },
  { v: 'focused', emoji: '😊' },
  { v: 'okay', emoji: '🙂' },
  { v: 'stressed', emoji: '😤' },
  { v: 'tired', emoji: '😴' },
  { v: 'brain-dead', emoji: '🤯' },
];

export default function EnergyModal({ onClose }) {
  const { energyCheckins, studyPlans, tasks, addEnergyCheckin, shiftHeavyToday } = useApp();
  const [level, setLevel] = useState(null);
  const [mood, setMood] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shifted, setShifted] = useState(null); // { plans, tasks }

  const todayLatest = energyCheckins.find((c) => LOCAL_DATE(c.created_at) === TODAY());
  const heavyPlans = studyPlans.filter((p) => p.plan_date === TODAY() && p.difficulty === 'hard' && !p.is_done).length;
  const heavyTasks = tasks.filter((t) => !t.is_completed && t.priority === 1 && LOCAL_DATE(t.due_date) === TODAY()).length;
  const heavyTotal = heavyPlans + heavyTasks;

  const save = async () => {
    if (!level) return;
    setBusy(true);
    try {
      await addEnergyCheckin({ energy_level: level, mood: mood || null });
      setSaved(true);
    } catch {
      /* swallow */
    } finally {
      setBusy(false);
    }
  };

  const shift = async () => {
    setBusy(true);
    try {
      const res = await shiftHeavyToday();
      setShifted(res);
    } catch {
      setShifted({ plans: 0, tasks: 0 });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="🔋 Cognitive battery" onClose={onClose}>
      {!saved ? (
        <div className="space-y-4">
          <p className="text-[13.5px] text-muted">Quick micro-checkin — how focused do you feel right now?</p>

          {todayLatest && (
            <p className="text-[12px] text-brand-lighter">
              Today's latest: <b>{todayLatest.energy_level}/10</b>{todayLatest.mood ? ` · ${MOODS.find((m) => m.v === todayLatest.mood)?.emoji || ''}` : ''}
            </p>
          )}

          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setLevel(v)}
                className="h-11 rounded-xl text-sm font-bold ring-1 transition"
                style={{
                  ...LEVEL_STYLE(v),
                  boxShadow: level === v ? '0 0 0 3px rgba(255,255,255,.35)' : '',
                  opacity: level === null || level === v ? 1 : 0.45,
                }}
              >
                {v}
              </button>
            ))}
          </div>

          <div>
            <p className="mb-1.5 text-[12.5px] text-muted">Pick a mood (optional)</p>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m.v}
                  type="button"
                  onClick={() => setMood(mood === m.v ? null : m.v)}
                  className={`chip transition ${mood === m.v ? 'bg-brand-light/30 ring-1 ring-brand-lighter' : 'bg-surface text-soft'}`}
                >
                  {m.emoji} {m.v}
                </button>
              ))}
            </div>
          </div>

          <button type="button" onClick={save} disabled={busy || !level} className="btn-primary w-full py-2.5 text-sm">
            {busy ? 'Saving…' : level ? 'Log my energy' : 'Pick a level first'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {level <= 4 ? (
            <>
              <p className="rounded-lg bg-warn/10 px-3 py-2.5 text-[13.5px] leading-snug text-warn-text">
                {lowEnergyRestMessage()}
              </p>
              {heavyTotal > 0 && !shifted && (
                <p className="text-[13.5px] text-body">
                  You have <b>{heavyTotal} heavy item(s)</b> scheduled today (hard-difficulty plans / high-priority tasks).
                  Want Sati to push them to tomorrow so you can rest?
                </p>
              )}
              {shifted && (
                <p className="text-[13.5px] text-brand-lighter">
                  ✅ Moved {shifted.plans} study plan(s) and {shifted.tasks} task(s) to tomorrow. Rest first — future-you says thanks.
                </p>
              )}
              {!shifted && (
                <button type="button" onClick={shift} disabled={busy} className="btn-primary w-full py-2.5 text-sm">
                  {busy ? 'Shifting…' : '↪ Shift heavy work to tomorrow'}
                </button>
              )}
            </>
          ) : (
            <p className="rounded-lg bg-brand-light/15 px-3 py-2.5 text-[13.5px] text-brand-lighter">
              Great energy — point it at your hardest task first while the battery is high. ⚡
            </p>
          )}
          <button type="button" onClick={onClose} className="btn-secondary w-full py-2.5 text-sm">Done</button>
        </div>
      )}
    </Modal>
  );
}