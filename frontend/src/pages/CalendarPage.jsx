import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { useApp } from '../store/AppContext';
import PageShell from '../components/layout/PageShell';
import { monthCells, formatFull, dueLabel, isOverdue } from '../lib/utils';
import TaskBubble from '../components/chat/TaskBubble';
import ExamBubble from '../components/chat/ExamBubble';

export default function CalendarPage() {
  const { tasks, exams } = useApp();
  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month());
  const [selected, setSelected] = useState(dayjs().format('YYYY-MM-DD'));

  const cells = useMemo(() => monthCells(year, month), [year, month]);

  const taskMap = useMemo(() => {
    const m = {};
    for (const t of tasks) {
      if (t.due_date) {
        const day = dayjs(t.due_date).format('YYYY-MM-DD');
        (m[day] = m[day] || { tasks: [], exams: [] }).tasks.push(t);
      }
    }
    for (const e of exams) {
      const day = dayjs(e.exam_date).format('YYYY-MM-DD');
      (m[day] = m[day] || { tasks: [], exams: [] }).exams.push(e);
    }
    return m;
  }, [tasks, exams]);

  const items = taskMap[selected] || { tasks: [], exams: [] };

  const changeMonth = (delta) => {
    const d = dayjs(new Date(year, month, 1)).add(delta, 'month');
    setYear(d.year());
    setMonth(d.month());
  };

  const today = dayjs().format('YYYY-MM-DD');
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <PageShell title="Calendar" subtitle={`${tasks.length} tasks · ${exams.length} exams`}>
      <div className="px-3 py-4 animate-pop">
        {/* Month navigation */}
        <div className="mb-3 flex items-center justify-between">
          <button type="button" onClick={() => changeMonth(-1)} className="flex h-8 w-8 items-center justify-center rounded-full text-[#8696a0] hover:bg-surface hover:text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <p className="text-[16px] font-semibold text-white">{MONTH_NAMES[month]} {year}</p>
          <button type="button" onClick={() => changeMonth(1)} className="flex h-8 w-8 items-center justify-center rounded-full text-[#8696a0] hover:bg-surface hover:text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>

        {/* Day labels */}
        <div className="mb-1 grid grid-cols-7 gap-0 text-center text-[11px] font-medium text-[#8696a0]">
          {DAY_LABELS.map((d) => <div key={d} className="py-1">{d}</div>)}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-0">
          {cells.map((cell) => {
            const date = cell.format('YYYY-MM-DD');
            const inMonth = cell.month() === month;
            const hasData = !!taskMap[date];
            const hasTasks = hasData && taskMap[date].tasks.length;
            const hasExams = hasData && taskMap[date].exams.length;
            const isSelected = date === selected;
            const isToday = date === today;

            return (
              <button
                key={date}
                type="button"
                onClick={() => setSelected(date)}
                className={`relative flex h-12 flex-col items-center justify-center gap-0.5 text-[13.5px] transition rounded-lg mx-0.5 ${
                  isSelected
                    ? 'bg-brand-lighter/20 text-brand-lighter font-semibold'
                    : isToday
                      ? 'text-brand-lighter font-medium'
                      : inMonth ? 'text-white hover:bg-surface' : 'text-[#445059]'
                }`}
              >
                <span>{cell.date()}</span>
                <span className="flex gap-0.5">
                  {hasTasks && <span className="h-1.5 w-1.5 rounded-full bg-brand-lighter" />}
                  {hasExams && <span className="h-1.5 w-1.5 rounded-full bg-[#F15C6D]" />}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected day */}
        <div className="mt-3 rounded-xl bg-surface-dark p-3 ring-1 ring-surface">
          <p className="mb-2 text-sm font-medium text-[#8696a0]">{dayjs(selected).format('ddd, MMM D, YYYY')}</p>
          {!items.tasks.length && !items.exams.length && (
            <p className="py-4 text-center text-sm text-[#8696a0]">Nothing planned for this day.</p>
          )}
          <div className="space-y-2">
            {items.tasks.map((t) => <TaskBubble key={t.id} task={t} />)}
            {items.exams.map((e) => <ExamBubble key={e.id} exam={e} />)}
          </div>
        </div>
      </div>
    </PageShell>
  );
}