// Crisis Mode — instantly breaks a massive exam goal into micro-steps.

const dayAt = (i, hour = 18) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

export function crisisMicroTasks({ subject, examDate = new Date().toISOString(), topics = [] }) {
  const daysLeft = Math.max(1, Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000));
  const subjectTopics = topics.filter(
    (t) => (t.subject || '').toLowerCase() === (subject || '').toLowerCase() && (t.confidence || 3) <= 2
  );

  const tasks = [];
  const push = (title, i, priority = 2, description) => {
    if (i > daysLeft) return;
    tasks.push({
      title,
      subject,
      due_date: dayAt(i),
      priority,
      description: description || null,
    });
  };

  push(`List the ${subject} syllabus & mark weak chapters`, 1, 1, 'Crisis step: map what matters most.');
  if (subjectTopics.length > 0) {
    push(`Round 1 · Weak area: ${subjectTopics[0].topic || subject}`, 1, 1, 'Start with your lowest-confidence topic.');
  }
  if (subjectTopics.length > 1) {
    push(`Round 2 · Weak area: ${subjectTopics[1].topic || subject}`, 2, 1, 'Second priority — lowest confidence.');
  }
  if (subjectTopics.length >= 3) {
    push(`Round 3 · Weak area: ${subjectTopics[2].topic || subject}`, 2, 1);
  }

  // Sprinkle revision rounds across the remaining days.
  const windows = Math.min(daysLeft, 4);
  for (let i = 0; i < windows; i += 1) {
    const day = 1 + Math.floor((i / Math.max(1, windows - 1)) * Math.max(0, daysLeft - 1));
    if (day > daysLeft || day <= 1) continue;
    push(`Revise ${subject} core notes (pass ${i + 1})`, day, 2, 'Re-read and re-derive every formula.');
  }

  if (daysLeft >= 2) {
    push(`Solve a full ${subject} past paper under timed conditions`, Math.max(1, daysLeft - 2), 1, 'No notes. Simulate the exam.');
  }
  if (daysLeft >= 1) {
    push(`Mock self-test on ${subject}`, Math.max(1, daysLeft - 1), 1, 'Question bank sprint — count correct vs wrong.');
  }
  push(`Last ${subject} revision pass + formula sheet`, daysLeft, 1, 'Fold formulas, skim weak areas, sleep early.');
  push(`Rest & sleep early (${subject} exam soon)`, daysLeft, 3, 'Sharp brain beats another hour of cramming.');

  return tasks.slice(0, 12);
}