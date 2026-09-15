import { useEffect, useRef, useState } from 'react';
import Modal from '../ui/Modal';
import { useApp } from '../../store/AppContext';
import { speechSupported, createRecognizer, transcriptToCandidates } from '../../lib/voice';

export default function VoiceDumpModal({ onClose }) {
  const { addTask } = useApp();
  const supported = speechSupported();
  const [recording, setRecording] = useState(false);
  const [finalText, setFinalText] = useState('');
  const [interim, setInterim] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [subject, setSubject] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const recRef = useRef(null);
  const finalTextRef = useRef('');

  const stopRec = () => {
    recRef.current?.stop();
    recRef.current = null;
    setRecording(false);
  };

  const startRec = () => {
    setFinalText('');
    setInterim('');
    setCandidates([]);
    const rec = createRecognizer({
      onResult: ({ final, interim: inter }) => {
        if (final) finalTextRef.current += final;
        setFinalText(finalTextRef.current);
        setInterim(inter);
        setCandidates(transcriptToCandidates(`${finalTextRef.current} ${inter}`));
      },
      onEnd: () => {
        if (recRef.current === rec) setRecording(false);
      },
    });
    if (!rec) return;
    recRef.current = rec;
    finalTextRef.current = '';
    setRecording(true);
    rec.start();
  };

  useEffect(() => () => recRef.current?.stop(), []);

  const toggle = (title) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  useEffect(() => {
    setSelected(new Set(candidates.map((c) => c)));
  }, [candidates.length]);

  const submit = async () => {
    const items = candidates.filter((c) => selected.has(c));
    if (!items.length) return;
    setBusy(true);
    try {
      for (const title of items) {
        try {
          await addTask({
            title,
            subject: subject.trim() || 'Voice note',
            priority: 2,
            description: `🎤 Voice dump · ${new Date().toLocaleString()}`,
          });
        } catch { /* skip duplicates */ }
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="🎤 Smart audio dump" onClose={onClose}>
      {!supported ? (
        <div className="space-y-3">
          <p className="text-[13.5px] text-muted">
            Your browser doesn't support live voice transcription. Try Chrome or Edge — or just type your thoughts in the chat and we'll tidy them into tasks.
          </p>
          <button type="button" onClick={onClose} className="btn-secondary w-full py-2.5 text-sm">Close</button>
        </div>
      ) : done ? (
        <div className="space-y-3">
          <p className="rounded-lg bg-brand-light/15 px-3 py-2.5 text-[13.5px] text-brand-lighter">
            ✅ Dumped! Your voice notes are now tasks. Go check the chat feed.
          </p>
          <button type="button" onClick={onClose} className="btn-primary w-full py-2.5 text-sm">Done</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={recording ? stopRec : startRec}
              className={`flex-1 rounded-xl py-3 text-sm font-semibold transition ${recording ? 'bg-danger text-white animate-pulse' : 'btn-primary'}`}
            >
              {recording ? '⏹ Stop & process' : '🎙 Start talking'}
            </button>
            <input
              className="input-round w-40"
              placeholder="Subject (optional)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {(interim || finalText) && (
            <div className="max-h-32 overflow-y-auto rounded-lg bg-surface px-3 py-2 text-[13.5px] text-body">
              {finalText}<span className="text-muted">{interim}</span>
            </div>
          )}

          {candidates.length > 0 && (
            <>
              <div>
                <p className="mb-1.5 text-[12.5px] text-muted">Tap to keep / drop each todo</p>
                <div className="max-h-52 space-y-1.5 overflow-y-auto">
                  {candidates.map((c) => {
                    const on = selected.has(c);
                    return (
                      <label key={c} className="flex cursor-pointer items-start gap-2 rounded-lg bg-surface px-3 py-2 text-[13.5px] text-body">
                        <input type="checkbox" className="mt-0.5 accent-[#25D366]" checked={on} onChange={() => toggle(c)} />
                        <span className={on ? '' : 'line-through opacity-50'}>{c}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <button type="button" onClick={submit} disabled={busy || selected.size === 0} className="btn-primary w-full py-2.5 text-sm">
                {busy ? 'Adding…' : `+ Add ${selected.size} task${selected.size === 1 ? '' : 's'}`}
              </button>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}