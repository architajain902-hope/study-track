// Smart Study Sprints — Pomodoro intervals adapt to a subject's difficulty,
// inferred from tracked topic confidence (weak subject → shorter sprints).

const CONFIGS = {
  easy: { difficulty: 'easy', label: 'Easy', study: 25, brk: 5, longBrk: 15, rounds: 4 },
  medium: { difficulty: 'medium', label: 'Medium', study: 20, brk: 5, longBrk: 10, rounds: 4 },
  hard: { difficulty: 'hard', label: 'Hard', study: 15, brk: 5, longBrk: 10, rounds: 4 },
};

export function subjectDifficulty(subject, topics = []) {
  const list = topics.filter((t) => (t.subject || '').toLowerCase() === (subject || '').toLowerCase());
  if (list.length === 0) return 'medium';
  const avg = list.reduce((a, t) => a + (t.confidence || 3), 0) / list.length;
  if (avg <= 2) return 'hard';
  if (avg >= 4) return 'easy';
  return 'medium';
}

export function sprintConfig(subject, topics = []) {
  return CONFIGS[subjectDifficulty(subject, topics)];
}