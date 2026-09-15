import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import PageShell from '../components/layout/PageShell';
import Modal from '../components/ui/Modal';
import { useApp } from '../store/AppContext';

const CONFIDENCE_LABELS = {
  1: 'Very weak',
  2: 'Weak',
  3: 'Okay',
  4: 'Strong',
  5: 'Mastered',
};
const CONFIDENCE_COLORS = {
  1: '#d94c5e',
  2: '#e6a23c',
  3: '#f0c851',
  4: '#8cc63f',
  5: '#25b16c',
};

export default function AnalysisPage() {
  const { topics, testRecords, deleteTestRecord } = useApp();
  const [testModal, setTestModal] = useState(null); // null | {} | {record}

  const perTestSubject = useMemo(() => {
    const sub = {};
    for (const r of testRecords) {
      if (r.max_score > 0) {
        sub[r.subject] = sub[r.subject] || [];
        sub[r.subject].push(Number(r.score) / Number(r.max_score));
      }
    }
    const out = [];
    for (const [subject, ratios] of Object.entries(sub)) {
      const avg = (ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100;
      out.push({ subject, avg, n: ratios.length });
    }
    return out.sort((a, b) => b.avg - a.avg);
  }, [testRecords]);

  const overallAvg = useMemo(() => {
    if (!testRecords.length) return 0;
    const sum = testRecords.reduce((a, r) => (r.max_score > 0 ? a + Number(r.score) / Number(r.max_score) : a), 0);
    return Math.round((sum / testRecords.filter((r) => r.max_score > 0).length) * 100);
  }, [testRecords]);

  const bySubject = useMemo(() => {
    const map = {};
    for (const t of topics) {
      map[t.subject] = map[t.subject] || [];
      map[t.subject].push(t);
    }
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [topics]);

  const averagesBySubject = useMemo(() => {
    const out = {};
    for (const [subject, list] of bySubject) {
      out[subject] = Math.round(list.reduce((a, t) => a + t.confidence, 0) / list.length);
    }
    return out;
  }, [bySubject]);

  return (
    <PageShell title="Analysis" subtitle="Weak vs strong, tests & practice">
      <div className="px-4 py-4 space-y-5 animate-pop">
        {/* Test performance */}
        <div className="rounded-xl bg-surface-dark p-4 ring-1 ring-surface">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-medium text-white">Test & practice performance</p>
            <button type="button" onClick={() => setTestModal({})} className="btn-primary px-3 py-1.5 text-xs">+ Log a test</button>
          </div>

          {testRecords.length > 0 && (
            <div className="mb-4 flex items-end gap-3">
              <div>
                <div className="text-3xl font-bold text-brand-lighter">{overallAvg}%</div>
                <div className="text-[11px] text-muted">overall average</div>
              </div>
              <div className="flex-1">
                {perTestSubject.map((s) => (
                  <div key={s.subject} className="mb-1.5">
                    <div className="flex justify-between text-[11.5px]">
                      <span className="text-muted">{s.subject}</span>
                      <span className="text-soft">{Math.round(s.avg)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-ink">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, s.avg)}%`,
                          backgroundColor: s.avg >= 70 ? 'rgb(var(--brand-lighter))' : s.avg >= 40 ? 'rgb(var(--warn))' : 'rgb(var(--danger))',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {testRecords.length === 0 && (
            <p className="mb-3 text-[13px] text-muted">Log practice or mock tests with scores to build your analysis.</p>
          )}

          <div className="space-y-2">
            {testRecords.map((r) => {
              const pct = r.max_score > 0 ? Math.round((Number(r.score) / Number(r.max_score)) * 100) : 0;
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-lg bg-surface px-3 py-2.5">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ backgroundColor: `${pct >= 70 ? '#25b16c' : pct >= 40 ? '#e6a23c' : '#d94c5e'}22`, color: pct >= 70 ? '#25b16c' : pct >= 40 ? '#e6a23c' : '#d94c5e' }}
                  >
                    {pct}%
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{r.test_name}</p>
                    <p className="text-[11.5px] text-muted">
                      {r.subject} · {r.test_type === 'practice' ? 'Practice' : 'Test'} · {r.score}/{r.max_score}
                      {r.taken_on ? ` · ${dayjs(r.taken_on).format('MMM D')}` : ''}
                    </p>
                  </div>
                  <button type="button" onClick={() => setTestModal({ record: r })} className="shrink-0 text-muted hover:text-white" title="Edit">✏️</button>
                  <button type="button" onClick={() => deleteTestRecord(r.id)} className="shrink-0 text-muted hover:text-danger" title="Delete">🗑️</button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weak / strong topic analysis */}
        <div className="rounded-xl bg-surface-dark p-4 ring-1 ring-surface">
          <p className="mb-3 font-medium text-white">Topic &amp; chapter strength report</p>
          {bySubject.length === 0 && <p className="text-[13px] text-muted">Add topics on the Planner tab with a confidence rating to see your weak vs strong areas.</p>}

          {bySubject.map(([subject, list]) => {
            const avg = averagesBySubject[subject];
            const weak = list.filter((t) => t.confidence <= 2);
            const strong = list.filter((t) => t.confidence >= 4);
            return (
              <div key={subject} className="mb-4 last:mb-0">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="font-medium text-white">{subject}</p>
                  <span
                    className="chip"
                    style={{ backgroundColor: `${CONFIDENCE_COLORS[Math.min(5, Math.max(1, avg))]}22`, color: CONFIDENCE_COLORS[Math.min(5, Math.max(1, avg))] }}
                  >
                    {CONFIDENCE_LABELS[Math.min(5, Math.max(1, avg))]}
                  </span>
                </div>
                <div className="mb-2 flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <div
                      key={v}
                      className="h-1.5 flex-1 rounded-full"
                      style={{ backgroundColor: v <= avg ? CONFIDENCE_COLORS[v] : 'rgb(var(--surface))' }}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((t) => (
                    <span
                      key={t.id}
                      className={`chip border ${t.confidence <= 2 ? 'border-danger/30 bg-danger/10 text-danger' : t.confidence >= 4 ? 'border-brand-lighter/30 bg-brand-light/15 text-brand-lighter' : 'bg-surface-light text-soft'}`}
                      title={`${t.chapter} · conf ${t.confidence}/5`}
                    >
                      {t.confidence <= 2 ? '🐢' : t.confidence >= 4 ? '💪' : '•'} {t.topic}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {testModal && <TestForm onClose={() => setTestModal(null)} initial={testModal.record} />}
    </PageShell>
  );
}

function TestForm({ onClose, initial }) {
  const { addTestRecord, updateTestRecord } = useApp();
  const [vals, setVals] = useState({
    subject: initial?.subject || '',
    test_name: initial?.test_name || '',
    test_type: initial?.test_type || 'test',
    score: initial?.score ?? '',
    max_score: initial?.max_score ?? 100,
    taken_on: initial?.taken_on || dayjs().format('YYYY-MM-DD'),
    notes: initial?.notes || '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setVals((p) => ({ ...p, [k]: v }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!vals.subject.trim() || !vals.test_name.trim()) return setError('Subject and test name are required.');
    if (Number(vals.score) < 0 || Number(vals.max_score) < 1) return setError('Enter valid score values.');
    setBusy(true);
    try {
      const payload = {
        subject: vals.subject.trim(),
        test_name: vals.test_name.trim(),
        test_type: vals.test_type,
        score: Number(vals.score) || 0,
        max_score: Number(vals.max_score) || 100,
        taken_on: vals.taken_on || null,
        notes: vals.notes.trim() || null,
      };
      if (initial?.id) await updateTestRecord(initial.id, payload);
      else await addTestRecord(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={initial?.id ? 'Edit test' : 'Log a test / practice'} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input className="input-round" placeholder="Subject (e.g. Math)" value={vals.subject} onChange={(e) => set('subject', e.target.value)} autoFocus />
          <select className="input-round bg-surface text-white" value={vals.test_type} onChange={(e) => set('test_type', e.target.value)}>
            <option value="test">Test</option>
            <option value="practice">Practice</option>
          </select>
        </div>
        <input className="input-round" placeholder="Test name (e.g. Unit Test 2)" value={vals.test_name} onChange={(e) => set('test_name', e.target.value)} />
        <div className="grid grid-cols-3 gap-3">
          <input className="input-round" type="number" step="0.5" min={0} placeholder="Score" value={vals.score} onChange={(e) => set('score', e.target.value)} />
          <input className="input-round" type="number" step="0.5" min={1} placeholder="Max" value={vals.max_score} onChange={(e) => set('max_score', e.target.value)} />
          <input className="input-round" type="date" value={vals.taken_on} onChange={(e) => set('taken_on', e.target.value)} />
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