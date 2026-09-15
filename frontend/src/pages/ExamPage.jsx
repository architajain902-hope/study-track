import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import PageShell from '../components/layout/PageShell';
import ExamForm from '../components/forms/ExamForm';
import { formatFull, daysUntil, dueLabel, daysAgoLabel } from '../lib/utils';

function ExamDetail({ exam, onClose, onBack }) {
  const { deleteExam } = useApp();
  const diff = daysUntil(exam.exam_date);

  const onDelete = async () => {
    if (!window.confirm('Delete this exam?')) return;
    await deleteExam(exam.id);
    onBack();
  };

  return (
    <div className="px-4 py-5 animate-pop">
      <div className="rounded-xl bg-surface-dark p-4 ring-1 ring-surface">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-light/30 text-lg">📝</div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-white">{exam.subject}</h2>
            <div className={`mt-2 text-4xl font-bold ${diff === 0 ? 'text-brand-lighter' : 'text-white'}`}>
              {diff < 0 ? 'Done' : diff === 0 ? 'Today' : diff}
              {diff > 0 && <span className="ml-1 text-sm font-normal text-[#8696a0]">days left</span>}
            </div>
          </div>
        </div>

        {exam.notes && (
          <div className="mt-4 whitespace-pre-line rounded-lg bg-ink/50 p-3 text-[14.5px] text-[#c1ccd1]">
            {exam.notes}
          </div>
        )}

        <div className="mt-4 space-y-2 text-sm text-[#8696a0]">
          <div className="flex items-center gap-2">
            <span>📅</span>
            <span>{formatFull(exam.exam_date)} · {dueLabel(exam.exam_date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>⏱</span>
            <span>Added {daysAgoLabel(exam.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5 text-sm">✏️ Edit</button>
        <button type="button" onClick={onDelete} className="btn-danger flex-1 py-2.5 text-sm">🗑 Delete</button>
      </div>
    </div>
  );
}

export default function ExamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { exams } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (id) {
      const found = exams.find((e) => e.id === id);
      if (found) { setSelected(found); setShowForm(false); }
    }
  }, [id, exams]);

  if (selected && !showForm) {
    return (
      <PageShell title={selected.subject} subtitle="Exam detail">
        <ExamDetail
          exam={selected}
          onBack={() => { setSelected(null); navigate('/exam', { replace: true }); }}
          onClose={() => setShowForm(true)}
        />
      </PageShell>
    );
  }

  return (
    <PageShell title="Exams" subtitle={`${exams.length} upcoming`}>
      <div className="px-4 py-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[17px] font-semibold text-white">Exam Schedule</h3>
          <button type="button" onClick={() => setShowForm(true)} className="btn-primary px-3 py-1.5 text-sm">
            + New
          </button>
        </div>

        {!exams.length && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="text-4xl">📝</div>
            <p className="text-sm text-[#8696a0]">No exams yet. Add one to see it here and on the dashboard.</p>
          </div>
        )}

        <div className="space-y-2">
          {[...exams]
            .sort((a, b) => +new Date(a.exam_date) - +new Date(b.exam_date))
            .map((e) => {
              const diff = daysUntil(e.exam_date);
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => { setSelected(e); }}
                  className="flex w-full items-center gap-3 rounded-xl bg-surface-dark px-3 py-3 text-left transition hover:bg-surface ring-1 ring-surface"
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl font-bold ${diff === 0 ? 'bg-brand-lighter/20 text-brand-lighter' : 'bg-surface-light text-white'}`}>
                    {diff < 0 ? '✓' : diff}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{e.subject}</p>
                    <p className="text-[12.5px] text-[#8696a0]">{formatFull(e.exam_date)} · {dueLabel(e.exam_date)}</p>
                  </div>
                  {diff >= 0 && diff <= 3 && (
                    <span className="shrink-0 chip bg-brand-lighter/20 text-brand-lighter text-[11px]">Soon</span>
                  )}
                </button>
              );
            })}
        </div>
      </div>

      {showForm && <ExamForm onClose={() => setShowForm(false)} initial={selected} />}
    </PageShell>
  );
}