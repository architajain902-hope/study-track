import { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { RECURRENCE_LABELS } from '../../lib/utils';
import Modal from '../ui/Modal';

const defaultValues = {
  title: '',
  description: '',
  subject: '',
  due_date: '',
  priority: 2,
  recurrence: 'none',
};

export default function TaskForm({ onClose, initial }) {
  const { addTask, updateTask } = useApp();
  const [vals, setVals] = useState({
    ...defaultValues,
    ...initial,
    due_date: initial?.due_date?.slice(0, 16) || '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setVals((p) => ({ ...p, [k]: v }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!vals.title.trim()) return setError('Title is required.');
    setBusy(true);
    try {
      const payload = {
        ...vals,
        title: vals.title.trim(),
        description: vals.description.trim() || null,
        subject: vals.subject.trim() || null,
        due_date: vals.due_date || null,
        priority: Number(vals.priority),
      };
      if (initial?.id) {
        await updateTask(initial.id, payload);
      } else {
        await addTask(payload);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save task.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={initial?.id ? 'Edit task' : 'New task'} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="input-round"
          placeholder="Task title"
          value={vals.title}
          onChange={(e) => set('title', e.target.value)}
          autoFocus
        />
        <textarea
          className="input-round min-h-[70px] resize-none"
          placeholder="Description (optional)"
          value={vals.description}
          onChange={(e) => set('description', e.target.value)}
          rows={2}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className="input-round"
            placeholder="Subject (e.g. Math)"
            value={vals.subject}
            onChange={(e) => set('subject', e.target.value)}
          />
          <input
            className="input-round"
            type="datetime-local"
            value={vals.due_date}
            onChange={(e) => set('due_date', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[13px] text-[#8696a0]">Priority</label>
            <select
              className="input-round bg-surface text-white"
              value={vals.priority}
              onChange={(e) => set('priority', Number(e.target.value))}
            >
              <option value={1}>🔴 High</option>
              <option value={2}>🟡 Medium</option>
              <option value={3}>🟢 Low</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[13px] text-[#8696a0]">Recurrence</label>
            <select
              className="input-round bg-surface text-white"
              value={vals.recurrence}
              onChange={(e) => set('recurrence', e.target.value)}
            >
              {Object.entries(RECURRENCE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary px-5 py-2 text-sm">
            {busy ? 'Saving…' : initial?.id ? 'Update' : 'Add task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}