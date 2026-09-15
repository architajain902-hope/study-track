import { useState } from 'react';
import Modal from '../ui/Modal';
import { useApp } from '../../store/AppContext';

export default function StudyPlanForm({ onClose, initial, defaultDate }) {
  const { addStudyPlan, updateStudyPlan } = useApp();
  const [vals, setVals] = useState({
    subject: initial?.subject || '',
    task_title: initial?.task_title || '',
    plan_date: initial?.plan_date || defaultDate || '',
    plan_type: initial?.plan_type || 'day',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setVals((p) => ({ ...p, [k]: v }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!vals.subject.trim()) return setError('Subject is required.');
    if (!vals.task_title.trim()) return setError('What do you plan to do?');
    setBusy(true);
    try {
      const payload = {
        subject: vals.subject.trim(),
        task_title: vals.task_title.trim(),
        plan_date: vals.plan_date || new Date().toISOString().slice(0, 10),
        plan_type: vals.plan_type,
      };
      if (initial?.id) await updateStudyPlan(initial.id, payload);
      else await addStudyPlan(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save plan.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={initial?.id ? 'Edit study plan' : 'Plan a study slot'} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            className="input-round"
            placeholder="Subject (e.g. Math)"
            value={vals.subject}
            onChange={(e) => set('subject', e.target.value)}
            autoFocus
          />
          <input
            className="input-round"
            type="date"
            value={vals.plan_date}
            onChange={(e) => set('plan_date', e.target.value)}
          />
        </div>
        <input
          className="input-round"
          placeholder="What will you do? e.g. Solve 10 integrals"
          value={vals.task_title}
          onChange={(e) => set('task_title', e.target.value)}
        />
        <div>
          <label className="mb-1 block text-[13px] text-muted">Plan type</label>
          <select className="input-round bg-surface text-white" value={vals.plan_type} onChange={(e) => set('plan_type', e.target.value)}>
            <option value="day">Daily plan</option>
            <option value="week">Weekly plan</option>
          </select>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary px-5 py-2 text-sm">
            {busy ? 'Saving…' : initial?.id ? 'Update' : 'Add plan'}
          </button>
        </div>
      </form>
    </Modal>
  );
}