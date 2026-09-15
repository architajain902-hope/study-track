import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import PageShell from '../components/layout/PageShell';
import StudyPlanForm from '../components/forms/StudyPlanForm';
import Modal from '../components/ui/Modal';
import { useApp } from '../store/AppContext';
import { daysUntil, formatFull, dueLabel, taskStatus, monthCells, LOCAL_DATE, TODAY } from '../lib/utils';

const CONFIDENCE_OPTIONS = [
  { v: 1, label: '💔 Very weak' },
  { v: 2, label: '😓 Weak' },
  { v: 3, label: '🙂 Okay' },
  { v: 4, label: '😎 Strong' },
  { v: 5, label: '🏆 Mastered' },
];

export default function PlannerPage() {
  const {
    tasks, exams, studyPlans, topics, toggleTask, deleteStudyPlan,
    updateStudyPlan, addTopic, updateTopic,
  } = useApp();
  const [planModal, setPlanModal] = useState(null); // null | { defaultDate }
  const [topicModal, setTopicModal] = useState(null); // null | { subject, chapter, topic }
  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month());

  const todayStr = TODAY();

  const overdue = useMemo(() => tasks.filter((t) => taskStatus(t).key === 'overdue'), [tasks]);
  const dueToday = useMemo(() => tasks.filter((t) => taskStatus(t).key === 'due-today'), [tasks]);
  const open = useMemo(
    () => tasks.filter((t) => !t.is_completed).filter((t) => !dueLabel(t.due_date).startsWith('Overdue')),
    [tasks]
  );

  const upcomingExams = useMemo(() => exams.filter((e) => daysUntil(e.exam_date) >= 0), [exams]);

  const planCount = useMemo(() => {
    const map = {};
    for (const p of studyPlans) {
      map[p.plan_date] = (map[p.plan_date] || 0) + 1;
    }
    return map;
  }, [studyPlans]);

  const tasksByDay = useMemo(() => {
    const map = {};
    for (const t of tasks) if (t.due_date) map[LOCAL_DATE(t.due_date)] = (map[LOCAL_DATE(t.due_date)] || 0) + 1;
    return map;
  }, [tasks]);

  const examsByDay = useMemo(() => {
    const map = {};
    for (const e of exams) map[LOCAL_DATE(e.exam_date)] = (map[LOCAL_DATE(e.exam_date)] || 0) + 1;
    return map;
  }, [exams]);

  const cells = useMemo(() => monthCells(year, month), [year, month]);

  const changeMonth = (delta) => {
    const d = dayjs(`${year}-${month + 1}-01`).add(delta, 'month');
    setYear(d.year());
    setMonth(d.month());
  };

  const plansForToday = studyPlans.filter((p) => p.plan_date === todayStr);

  const togglePlan = (p) => updateStudyPlan(p.id, { is_done: !p.is_done });

  const weakTopics = topics.filter((t) => t.confidence <= 2);

  return (
    <PageShell title="Planner" subtitle="Your academic command centre">
      <div className="px-4 py-4 space-y-5 animate-pop">
        {/* Quick overview */}
        <div className="grid grid-cols-3 gap-3">
          <Link to="/task/" className="rounded-xl bg-surface-dark p-3 text-center ring-1 ring-surface">
            <div className="text-xl font-bold text-danger">{overdue.length}</div>
            <div className="text-[11.5px] text-muted">Overdue</div>
          </Link>
          <div className="rounded-xl bg-surface-dark p-3 text-center ring-1 ring-surface">
            <div className="text-xl font-bold text-warn-text">{dueToday.length}</div>
            <div className="text-[11.5px] text-muted">Due today</div>
          </div>
          <div className="rounded-xl bg-surface-dark p-3 text-center ring-1 ring-surface">
            <div className="text-xl font-bold text-brand-lighter">{open.length}</div>
            <div className="text-[11.5px] text-muted">In progress</div>
          </div>
        </div>

        {/* Academic calendar */}
        <div className="rounded-xl bg-surface-dark p-4 ring-1 ring-surface">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-medium text-white">Academic calendar</p>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => changeMonth(-1)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface">‹</button>
              <span className="min-w-[110px] text-center text-sm font-medium text-white">{dayjs(`${year}-${month + 1}-01`).format('MMMM YYYY')}</span>
              <button type="button" onClick={() => changeMonth(1)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface">›</button>
            </div>
          </div>
          <div className="mb-1 grid grid-cols-7 text-center text-[10.5px] font-medium text-muted">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {cells.map((cell) => {
              const key = cell.format('YYYY-MM-DD');
              const inMonth = cell.month() === month;
              const isToday = key === todayStr;
              const active = Number(planCount[key] || 0) + Number(tasksByDay[key] || 0) + Number(examsByDay[key] || 0) > 0;
              return (
                <div
                  key={key}
                  className={`flex h-9 flex-col items-center justify-center rounded-md text-[12px] transition ${
                    inMonth ? 'text-white hover:bg-surface' : 'text-dim'
                  } ${isToday ? 'bg-brand-light/30 font-bold ring-1 ring-brand-lighter' : ''}`}
                >
                  <span>{cell.date()}</span>
                  <span className="flex gap-[2px]">
                    {planCount[key] > 0 && <span className="h-1 w-1 rounded-full bg-brand-lighter" />}
                    {tasksByDay[key] > 0 && <span className="h-1 w-1 rounded-full bg-accent" />}
                    {examsByDay[key] > 0 && <span className="h-1 w-1 rounded-full bg-danger" />}
                    {!active && <span className="h-1 w-1 rounded-full bg-transparent" />}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plan my day */}
        <div className="rounded-xl bg-surface-dark p-4 ring-1 ring-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Plan my day 🎯</p>
              <p className="text-[12px] text-muted">{todayStr} · {plansForToday.length} planned slot(s)</p>
            </div>
            <button type="button" onClick={() => setPlanModal({ defaultDate: todayStr })} className="btn-primary px-3 py-1.5 text-xs">+ Add slot</button>
          </div>
          <div className="mt-3 space-y-2">
            {plansForToday.length === 0 && <p className="text-[13px] text-muted">No study slots yet. Add one, or visit the chat to drop a task.</p>}
            {plansForToday.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2">
                <button
                  type="button"
                  onClick={() => togglePlan(p)}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    p.is_done ? 'border-brand-lighter bg-brand-lighter text-onbrand' : 'border-muted'
                  }`}
                >
                  {p.is_done && (
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[14px] ${p.is_done ? 'line-through text-muted' : 'text-white'}`}>{p.task_title}</p>
                  <p className="text-[11.5px] text-muted">📚 {p.subject} · {p.plan_type === 'week' ? 'Weekly' : 'Daily'}</p>
                </div>
                <button type="button" onClick={() => setPlanModal({ plan: p, defaultDate: todayStr })} className="text-muted hover:text-white" title="Edit">
                  ✏️
                </button>
                <button type="button" onClick={() => deleteStudyPlan(p.id)} className="text-muted hover:text-danger" title="Delete">
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Exam schedule & todo list */}
        <div className="rounded-xl bg-surface-dark p-4 ring-1 ring-surface">
          <p className="mb-3 font-medium text-white">Exam schedule</p>
          {upcomingExams.length === 0 && <p className="text-[13px] text-muted">No exams yet. Add one from the chat (📝) or <Link to="/exam" className="text-brand-lighter">here</Link>.</p>}
          <div className="space-y-2">
            {upcomingExams.map((e) => {
              const d = daysUntil(e.exam_date);
              return (
                <Link to={`/exam/${e.id}`} key={e.id} className="flex items-center gap-3 rounded-lg bg-surface px-3 py-2.5 transition hover:bg-surface-light">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${d <= 3 ? 'bg-danger/20 text-danger' : 'bg-surface-light text-soft'}`}>
                    {d}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{e.subject}</p>
                    <p className="text-[11.5px] text-muted">{formatFull(e.exam_date)} · {d === 0 ? 'today!' : d === 1 ? 'tomorrow' : `${d} days`}</p>
                  </div>
                  {d <= 7 && <span className="chip bg-warn/15 text-warn-text">soon</span>}
                </Link>
              );
            })}
          </div>
        </div>

        {/* To-do list with status toggles */}
        <div className="rounded-xl bg-surface-dark p-4 ring-1 ring-surface">
          <p className="mb-3 font-medium text-white">My to-do list</p>
          <div className="space-y-1.5">
            {tasks.length === 0 && <p className="text-[13px] text-muted">Nothing here yet. Add tasks from the chat with “/task <b>title</b>”.</p>}
            {tasks.map((t) => {
              const st = taskStatus(t);
              return (
                <Link to={`/task/${t.id}`} key={t.id} className="flex items-center gap-2.5 rounded-lg bg-surface px-3 py-2 transition hover:bg-surface-light">
                  <button
                    type="button"
                    onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); toggleTask(t); }}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                      t.is_completed ? 'border-brand-lighter bg-brand-lighter text-onbrand' : 'border-muted'
                    }`}
                  >
                    {t.is_completed && (
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[14px] ${t.is_completed ? 'line-through text-muted' : 'text-white'}`}>{t.title}</p>
                    <p className="text-[11.5px] text-muted">
                      {t.subject ? `${t.subject} · ` : ''}{st.label}
                      {t.due_date && !t.is_completed ? ` · ${dueLabel(t.due_date)}` : ''}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Topic confidence tracker */}
        <div className="rounded-xl bg-surface-dark p-4 ring-1 ring-surface">
          <p className="mb-3 font-medium text-white">Topic confidence (weak → strong)</p>
          <button type="button" onClick={() => setTopicModal({})} className="mb-3 btn-secondary px-3 py-1.5 text-xs">+ Track a topic</button>
          <div className="space-y-2">
            {topics.length === 0 && <p className="text-[13px] text-muted">Log your chapters &amp; topics with a confidence rating to see weak vs strong spots.</p>}
            {weakTopics.length > 0 && (
              <div className="rounded-lg bg-warn/10 px-3 py-2 text-[12.5px] text-warn-text">
                🚩 Focus first: {weakTopics.slice(0, 3).map((t) => `${t.subject} · ${t.topic}`).join(', ')}
              </div>
            )}
            {topics.map((t) => (
              <div key={t.id} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] text-white">{t.topic}</p>
                  <p className="text-[11.5px] text-muted">{t.subject} · {t.chapter}</p>
                </div>
                <select
                  className="rounded-lg bg-surface-light px-2 py-1 text-[12px] text-white outline-none"
                  value={t.confidence}
                  onChange={(ev) => updateTopic(t.id, { confidence: Number(ev.target.value) })}
                >
                  {CONFIDENCE_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
                </select>
                <button type="button" onClick={() => setTopicModal({ topic: t })} className="text-muted hover:text-white" title="Edit">✏️</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {planModal && (
        <StudyPlanForm
          onClose={() => setPlanModal(null)}
          initial={planModal.plan}
          defaultDate={planModal.defaultDate}
        />
      )}

      {topicModal && <TopicForm onClose={() => setTopicModal(null)} initial={topicModal.topic} />}
    </PageShell>
  );
}

function TopicForm({ onClose, initial }) {
  const { addTopic, updateTopic } = useApp();
  const [vals, setVals] = useState({
    subject: initial?.subject || '',
    chapter: initial?.chapter || '',
    topic: initial?.topic || '',
    confidence: initial?.confidence ?? 3,
    notes: initial?.notes || '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setVals((p) => ({ ...p, [k]: v }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!vals.subject.trim() || !vals.topic.trim()) return setError('Subject and topic are required.');
    setBusy(true);
    try {
      const payload = {
        subject: vals.subject.trim(),
        chapter: vals.chapter.trim() || 'General',
        topic: vals.topic.trim(),
        confidence: Number(vals.confidence) || 3,
        notes: vals.notes.trim() || null,
      };
      if (initial?.id) await updateTopic(initial.id, payload);
      else await addTopic(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save topic.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={initial?.id ? 'Edit topic' : 'Track a topic'} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="input-round" placeholder="Subject (e.g. Physics)" value={vals.subject} onChange={(e) => set('subject', e.target.value)} autoFocus />
        <input className="input-round" placeholder="Chapter (e.g. Thermodynamics)" value={vals.chapter} onChange={(e) => set('chapter', e.target.value)} />
        <input className="input-round" placeholder="Topic (e.g. Entropy)" value={vals.topic} onChange={(e) => set('topic', e.target.value)} />
        <div>
          <label className="mb-1 block text-[13px] text-muted">Confidence</label>
          <select className="input-round bg-surface text-white" value={vals.confidence} onChange={(e) => set('confidence', Number(e.target.value))}>
            {CONFIDENCE_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
          </select>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary px-5 py-2 text-sm">{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}