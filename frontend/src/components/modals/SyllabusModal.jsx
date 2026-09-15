import { useRef, useState } from 'react';
import Modal from '../ui/Modal';
import { useApp } from '../../store/AppContext';
import { parseSyllabus, milestonesFromSyllabus } from '../../lib/syllabus';

export default function SyllabusModal({ onClose }) {
  const { addTask, exams } = useApp();
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef(null);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result || ''));
    reader.readAsText(file);
  };

  const parse = () => {
    const subjects = parseSyllabus(text);
    if (!subjects.length) return;
    setParsed(subjects);
    setMilestones(milestonesFromSyllabus(subjects, exams));
  };

  const create = async () => {
    setBusy(true);
    try {
      for (const m of milestones) {
        try { await addTask(m); } catch { /* skip duplicates */ }
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="📚 Automatic syllabus parsing" onClose={onClose}>
      {done ? (
        <div className="space-y-3">
          <p className="rounded-lg bg-brand-light/15 px-3 py-2.5 text-[13.5px] text-brand-lighter">
            ✅ {milestones.length} milestone(s) created as tasks, spaced out toward your exam dates. Check the chat or planner!
          </p>
          <button type="button" onClick={onClose} className="btn-primary w-full py-2.5 text-sm">Done</button>
        </div>
      ) : parsed ? (
        <div className="space-y-4">
          <div className="max-h-48 space-y-1.5 overflow-y-auto">
            {parsed.map((s) => (
              <div key={s.name} className="rounded-lg bg-surface px-3 py-2">
                <p className="text-[14px] font-medium text-white">{s.name}</p>
                <p className="text-[11.5px] text-muted">{s.lines.length} milestone(s) detected</p>
              </div>
            ))}
          </div>
          <p className="text-[12.5px] text-muted">
            Create as tasks with due dates spread toward the nearest matching exam ({milestones.length} total).
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setParsed(null); setMilestones([]); }} className="btn-secondary flex-1 py-2.5 text-sm">Back</button>
            <button type="button" onClick={create} disabled={busy} className="btn-primary flex-1 py-2.5 text-sm">
              {busy ? 'Creating…' : `+ Create ${milestones.length} milestones`}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[13.5px] text-muted">
            Paste your assignment sheet / syllabus below, or upload a <b>.txt</b> / <b>.md</b> file. Sati detects subjects, chapters and units → converts them into dated milestones.
          </p>
          <textarea
            className="input-round min-h-[140px] resize-none"
            placeholder={`e.g.\nSubject: Physics\nChapter 1 — Kinematics\nChapter 2 — Laws of Motion\n...`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
          />
          <div className="flex gap-2">
            <label className="btn-secondary flex-1 cursor-pointer py-2.5 text-center text-sm">
              ⬆️ Upload file
              <input type="file" ref={fileRef} accept=".txt,.md,.text,.csv" className="hidden" onChange={onFile} />
            </label>
            {fileName && <p className="self-center truncate text-[12px] text-muted">{fileName}</p>}
          </div>
          <button
            type="button"
            onClick={parse}
            disabled={!text.trim()}
            className="btn-primary w-full py-2.5 text-sm"
          >
            {text.trim() ? '🔍 Parse syllabus' : 'Paste or upload something first'}
          </button>
        </div>
      )}
    </Modal>
  );
}