import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import PageShell from '../components/layout/PageShell';
import TaskForm from '../components/forms/TaskForm';
import { PRIORITY_META, RECURRENCE_LABELS, formatFull, dueLabel, isOverdue } from '../lib/utils';

export default function TaskPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, toggleTask, deleteTask } = useApp();
  const [task, setTask] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const found = tasks.find((t) => t.id === id);
    if (found) setTask(found);
    else if (!tasks.length) return; // still loading
    else navigate('/', { replace: true });
  }, [id, tasks, navigate]);

  if (!task) return null;

  const meta = PRIORITY_META[task.priority] || PRIORITY_META[2];
  const overdue = !task.is_completed && task.due_date && isOverdue(task.due_date);

  const onToggle = async () => {
    setBusy(true);
    await toggleTask(task);
    setBusy(false);
  };

  const onDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    setBusy(true);
    await deleteTask(task.id);
    navigate('/', { replace: true });
  };

  return (
    <PageShell title="Task detail" subtitle={task.subject || undefined}>
      <div className="px-4 py-5 animate-pop">
        <div className={`rounded-xl border-l-4 bg-surface-dark p-4 ${meta.ring} ${overdue ? 'ring-1 ring-danger/60' : 'ring-1 ring-surface'}`}>
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={onToggle}
              disabled={busy}
              className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                task.is_completed ? 'border-brand-lighter bg-brand-lighter text-onbrand' : 'border-muted hover:border-brand-lighter'
              }`}
            >
              {task.is_completed && (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </button>
            <div className="min-w-0 flex-1">
              <h2 className={`text-xl font-bold text-white ${task.is_completed ? 'line-through decoration-muted' : ''}`}>
                {task.title}
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="chip" style={{ color: meta.color, backgroundColor: `${meta.color}22` }}>
                  {meta.label} priority
                </span>
                {task.subject && <span className="chip bg-surface-light text-soft">{task.subject}</span>}
                {task.recurrence && task.recurrence !== 'none' && (
                  <span className="chip bg-surface-light text-soft">↻ {RECURRENCE_LABELS[task.recurrence]}</span>
                )}
              </div>
            </div>
          </div>

          {task.description && (
            <div className="mt-4 whitespace-pre-line rounded-lg bg-ink/50 p-3 text-[14.5px] text-body">
              {task.description}
            </div>
          )}

          <div className="mt-4 space-y-2 text-sm text-muted">
            {task.due_date && (
              <div className="flex items-center gap-2">
                <span>📅</span>
                <span className={overdue ? 'text-danger font-medium' : ''}>{formatFull(task.due_date)} · {dueLabel(task.due_date)}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span>⏱</span>
              <span>Created {formatFull(task.created_at)}</span>
            </div>
            {task.completed_at && (
              <div className="flex items-center gap-2">
                <span>✅</span>
                <span>Completed {formatFull(task.completed_at)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => setEditModal(true)} disabled={busy} className="btn-secondary flex-1 py-2.5 text-sm">
            ✏️ Edit
          </button>
          <button type="button" onClick={onDelete} disabled={busy} className="btn-danger flex-1 py-2.5 text-sm">
            🗑 Delete
          </button>
        </div>
      </div>

      {editModal && <TaskForm initial={task} onClose={() => setEditModal(false)} />}
    </PageShell>
  );
}