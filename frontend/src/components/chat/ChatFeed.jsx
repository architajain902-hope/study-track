import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import TaskBubble from './TaskBubble';
import ExamBubble from './ExamBubble';
import { formatDay, sortFeed, dueLabel, daysUntil } from '../../lib/utils';
import { greeting, MASCOT, welcomeMessage, streakMessage, goalMetMessage, coldStreakMessage, overdueMessage } from '../../lib/motivation';

function DateSeparator({ label }) {
  return (
    <div className="my-2 flex justify-center">
      <span className="rounded-lg bg-surface-dark px-3 py-1 text-[11.5px] font-medium text-muted shadow-bubble">
        {label}
      </span>
    </div>
  );
}

function SystemMessage({ children }) {
  return (
    <div className="flex justify-center">
      <span className="max-w-[85%] rounded-lg bg-brand-light/20 px-3 py-1.5 text-center text-[12.5px] leading-snug text-brand-lighter shadow-bubble">
        {children}
      </span>
    </div>
  );
}

function NotificationsBar({ notifications }) {
  if (!notifications.length) return null;
  return (
    <div className="mb-3 space-y-1.5">
      {notifications.map((n) => {
        const isTask = n.kind === 'task_due';
        const title = isTask ? n.task?.title : n.exam?.subject;
        const when = isTask ? dueLabel(n.task?.due_date) : `${daysUntil(n.exam?.exam_date)} day(s) left`;
        const to = isTask ? `/task/${n.task.id}` : `/exam/${n.exam?.id}`;
        return (
          <Link
            key={`${n.kind}-${(n.task || n.exam).id}`}
            to={to}
            className="flex items-center gap-2 rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-[13px] text-warn-text transition hover:border-warn/60"
          >
            <span className="text-sm">⏰</span>
            <span className="min-w-0 flex-1 truncate font-medium">{title}</span>
            <span className="shrink-0 text-[11.5px] text-warn-muted">{when}</span>
          </Link>
        );
      })}
    </div>
  );
}

export default function ChatFeed({ onAddQuick }) {
  const { tasks, exams, streak, activeStreak, daily, notifications, profile } = useApp();

  const feed = useMemo(() => {
    const items = [
      ...tasks.map((t) => ({ kind: 'task', ref: t, date: t.created_at })),
      ...exams.map((e) => ({ kind: 'exam', ref: e, date: e.created_at })),
    ];
    return sortFeed(items);
  }, [tasks, exams]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const item of feed) {
      const day = item.date.slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(item);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }, [feed]);

  if (tasks.length === 0 && exams.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center animate-pop">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-dark text-3xl ring-1 ring-surface">🦉</div>
        <div>
          <h2 className="text-lg font-semibold text-white">{greeting()}! I'm {MASCOT}.</h2>
          <p className="mt-1 text-sm text-muted">
            This chat is your planner. Tell me a task, add an exam, or plan a study session — it'll all show up right here.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={onAddQuick} className="btn btn-primary px-4 py-2.5 text-sm">+ Add task</button>
          <Link to="/exam" className="btn btn-secondary px-4 py-2.5 text-sm">📝 Add exam</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-chat-pattern px-3 py-3 pb-6">
      <div className="mb-3 flex items-end gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-lighter to-brand text-base shadow-bubble">
          🦉
        </div>
        <div className="bubble bubble-in max-w-[75%]">
          <p className="text-[13.5px] leading-snug">
            <b>{MASCOT}</b> — {welcomeMessage(profile?.full_name)}
          </p>
          <p className="mt-1 text-[12px] text-muted">{greeting()}! I'm your study buddy. Tell me a task, an exam, or a plan and I'll keep you on track. 🌱</p>
        </div>
      </div>

      <SystemMessage>
        🎯 Daily goal: <b>{daily.completed}</b>/{daily.goal} tasks done today
      </SystemMessage>

      {daily.completed >= daily.goal && daily.goal > 0 && (
        <div className="mt-2">
          <SystemMessage>{goalMetMessage()} 🎉</SystemMessage>
        </div>
      )}

      {activeStreak > 0 && (
        <div className="mt-2">
          <SystemMessage>
            🔥 {streakMessage()} <b>{activeStreak}-day</b> streak{streak?.best_streak > activeStreak ? ` (best ${streak.best_streak})` : ''}.
          </SystemMessage>
        </div>
      )}

      {activeStreak === 0 && streak?.current_streak > 0 && (
        <div className="mt-2">
          <SystemMessage>😴 {coldStreakMessage()}</SystemMessage>
        </div>
      )}

      {tasks.some((t) => !t.is_completed && dueLabel(t.due_date).startsWith('Overdue')) && (
        <div className="mt-2">
          <SystemMessage>⏳ {overdueMessage()}</SystemMessage>
        </div>
      )}

      <div className="mt-3">
        <NotificationsBar notifications={notifications} />
      </div>

      <div className="space-y-3">
        {groups.map(([day, items], i) => (
          <div key={day}>
            <DateSeparator label={formatDay(day)} />
            <div className={i !== groups.length - 1 ? 'mb-3 space-y-3' : 'space-y-3'}>
              {items.map((item) => {
                const key = `${item.kind}-${item.ref.id}`;
                if (item.kind === 'exam') return <ExamBubble key={key} exam={item.ref} />;
                return <TaskBubble key={key} task={item.ref} />;
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-center">
        <span className="text-[11px] text-muted">
          {tasks.length} task{tasks.length === 1 ? '' : 's'} · {exams.length} exam{exams.length === 1 ? '' : 's'}
        </span>
      </div>
      <div className="h-4" />
    </div>
  );
}