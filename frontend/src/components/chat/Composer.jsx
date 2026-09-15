import { useState } from 'react';

export default function Composer({ onAddTask, onAddExam }) {
  const [text, setText] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    if (/^\/task\b|^\/t\b/i.test(trimmed)) {
      onAddTask(trimmed.replace(/^\/task\s*|\/t\s*/i, ''));
    } else if (/^\/exam\b|^\/e\b/i.test(trimmed)) {
      onAddExam(trimmed.replace(/^\/exam\s*|\/e\s*/i, ''));
    } else {
      onAddTask(trimmed);
    }
    setText('');
  };

  return (
    <form
      onSubmit={submit}
      className="flex items-center gap-2 border-t border-surface bg-surface-dark px-3 py-2.5 pb-safe"
    >
      <button
        type="button"
        onClick={onAddExam}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface hover:text-white"
        title="Add exam"
      >
        📝
      </button>
      <button
        type="button"
        onClick={() => onAddTask()}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface hover:text-white"
        title="Add task"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <input
        className="flex-1 bg-transparent text-[var(--text)] placeholder-[var(--text-muted)] outline-none"
        placeholder="Write a task, or /task Study calculus…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        type="submit"
        disabled={!text.trim()}
        aria-label="Send task"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-lighter text-onbrand transition hover:bg-brand-light disabled:opacity-30"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </form>
  );
}