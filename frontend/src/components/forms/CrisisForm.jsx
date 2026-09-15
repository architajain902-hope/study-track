import { useState } from 'react';
import Modal from '../ui/Modal';
import { useApp } from '../../store/AppContext';
import { crisisMicroTasks } from '../../lib/crisis';

export default function CrisisForm({ subject, examDate, onClose }) {
  const { topics, addTask } = useApp();
  const tasks = crisisMicroTasks({ subject, examDate, topics });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      for (const t of tasks) {
        try { await addTask(t); } catch { /* skip duplicates */ }
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`🆘 Crisis mode: ${subject}`} onClose={onClose}>
      {done ? (
        <div className="space-y-3">
          <p className="rounded-lg bg-brand-light/15 px-3 py-2.5 text-[13.5px] text-brand-lighter">
            ✅ {tasks.length} micro-tasks deployed. Start with the smallest, mark them off, watch the exam stop being scary.
          </p>
          <button type="button" onClick={onClose} className="btn-primary w-full py-2.5 text-sm">Let's go</button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[13px] text-muted">
            Turning a scary exam into tiny wins: {tasks.length} micro-steps, roughly one per day until the big day.
          </p>
          <div className="max-h-56 space-y-1.5 overflow-y-auto">
            {tasks.map((t) => (
              <div key={t.title} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-[13px] text-body">
                <span className="text-muted">{new Date(t.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                <span className="min-w-0 flex-1 truncate">{t.title}</span>
                <span className={t.priority === 1 ? 'chip bg-danger/20 text-danger shrink-0' : 'chip bg-surface-light text-soft shrink-0'}>
                  {t.priority === 1 ? 'must' : 'nice'}
                </span>
              </div>
            ))}
          </div>
          <button type="button" onClick={create} disabled={busy} className="btn-primary w-full py-2.5 text-sm">
            {busy ? 'Deploying…' : `⚡ Create ${tasks.length} micro-tasks`}
          </button>
        </div>
      )}
    </Modal>
  );
}