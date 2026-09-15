import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { formatTime, PRIORITY_META, dueLabel, formatDay, isOverdue, RECURRENCE_LABELS, taskStatus } from '../../lib/utils';

export default function TaskBubble({ task, senderName = 'You' }) {
  const { toggleTask } = useApp();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const overdue = !task.is_completed && task.due_date && isOverdue(task.due_date);
  const meta = PRIORITY_META[task.priority] || PRIORITY_META[2];
  const status = taskStatus(task);

  const onToggle = async (e) => {
    e.stopPropagation();
    setBusy(true);
    try {
      await toggleTask(task);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-start animate-pop">
      <span className="mb-1 pl-1 text-[13px] text-muted">{senderName}</span>
      <div className={`bubble bubble-in w-full cursor-pointer border-l-4 ${meta.ring} ${
                status.key === 'overdue' ? 'ring-1 ring-danger/60' : status.key === 'due-today' ? 'ring-1 ring-warn/50' : ''
              } ${task.is_completed ? 'opacity-60' : ''}`}>
        <button type="button" onClick={() => navigate(`/task/${task.id}`)} className="block w-full text-left">
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={onToggle}
              disabled={busy}
              aria-label={task.is_completed ? 'Mark incomplete' : 'Mark complete'}
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                task.is_completed ? 'border-brand-lighter bg-brand-lighter text-onbrand' : 'border-muted hover:border-brand-lighter'
              }`}
            >
              {task.is_completed && (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className={`font-medium ${task.is_completed ? 'line-through decoration-muted' : ''}`}>{task.title}</p>
              {task.description && (
                <p className="mt-0.5 whitespace-pre-line text-[13px] text-body">{task.description}</p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {task.subject && <span className="chip bg-surface-light text-soft">{task.subject}</span>}
                {task.due_date && (
                  <span className={`chip ${overdue ? 'bg-danger/20 text-danger' : 'bg-surface-light text-soft'}`}>
                    📅 {formatDay(task.due_date)} · {dueLabel(task.due_date)}
                  </span>
                )}
                {task.recurrence && task.recurrence !== 'none' && (
                  <span className="chip bg-surface-light text-soft">↻ {RECURRENCE_LABELS[task.recurrence] || task.recurrence}</span>
                )}
              </div>
            </div>
          </div>
        </button>
        <div className="mt-1 flex items-center justify-between">
          <span className="chip" style={{ color: meta.color, backgroundColor: `${meta.color}22` }}>
            {meta.label}
          </span>
          <span className="flex items-center gap-2">
            <span className={`chip ${status.key === 'completed' ? 'bg-brand-light/25 text-brand-lighter' : status.key === 'overdue' ? 'bg-danger/20 text-danger' : 'bg-surface-light text-soft'}`}>
              {status.label}
            </span>
            <span className="text-[11px] text-muted">{formatTime(task.created_at)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}