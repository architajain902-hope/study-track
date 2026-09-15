import { useState } from 'react';
import { useApp } from '../../store/AppContext';
import Modal from '../ui/Modal';

const defaultValues = { subject: '', exam_date: '', notes: '' };

export default function ExamForm({ onClose, initial }) {
  const { addExam, updateExam } = useApp();
  const [vals, setVals] = useState({
    ...defaultValues,
    ...initial,
    exam_date: initial?.exam_date?.slice(0, 16) || '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setVals((p) => ({ ...p, [k]: v }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!vals.subject.trim()) return setError('Subject is required.');
    if (!vals.exam_date) return setError('Date & time are required.');
    setBusy(true);
    try {
      const payload = {
        subject: vals.subject.trim(),
        exam_date: vals.exam_date,
        notes: vals.notes.trim() || null,
      };
      if (initial?.id) {
        await updateExam(initial.id, payload);
      } else {
        await addExam(payload);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save exam.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={initial?.id ? 'Edit exam' : 'Add exam'} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="input-round"
          placeholder="Subject (e.g. Mathematics)"
          value={vals.subject}
          onChange={(e) => set('subject', e.target.value)}
          autoFocus
        />
        <div>
          <label className="mb-1 block text-[13px] text-[#8696a0]">Date & time</label>
          <input
            className="input-round"
            type="datetime-local"
            value={vals.exam_date}
            onChange={(e) => set('exam_date', e.target.value)}
          />
        </div>
        <textarea
          className="input-round min-h-[60px] resize-none"
          placeholder="Notes (optional — syllabus, room number…)"
          value={vals.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={2}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary px-5 py-2 text-sm">
            {busy ? 'Saving…' : initial?.id ? 'Update' : 'Add exam'}
          </button>
        </div>
      </form>
    </Modal>
  );
}