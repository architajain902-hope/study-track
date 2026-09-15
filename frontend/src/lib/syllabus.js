// Automatic Syllabus Parsing — converts a pasted/uploaded assignment sheet
// into milestone tasks, spread toward the matching exam (or a default cadence).

const SUBJECT_RE = /^(?:subject|paper|semester|term|assignment)[ :\-–]*\s*(.+)/i;
const UNIT_RE = /^(?:chapter|unit|module|lesson|topic|section)\s*[0-9]+[):.\- ]*\s*(.{3,})/i;
const BULLET_RE = /^\s*(?:[-•*\u2022]|\d+[.)])\s+(.{3,})/;

export function parseSyllabus(text = '') {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const subjects = [];
  let currentSubject = null;

  const ensureSubject = (name) => {
    let found = subjects.find((s) => s.name.toLowerCase() === name.toLowerCase());
    if (!found) {
      found = { name, lines: [] };
      subjects.push(found);
    }
    return found;
  };

  for (const line of lines) {
    const subj = line.match(SUBJECT_RE);
    if (subj) {
      currentSubject = ensureSubject(subj[1].replace(/\s*[:]\s*$/, '').trim());
      continue;
    }
    const unit = line.match(UNIT_RE);
    const bullet = line.match(BULLET_RE);
    if (unit) {
      if (currentSubject) currentSubject.lines.push(unit[1].trim());
      else ensureSubject('General').lines.push(unit[1].trim());
    } else if (bullet && currentSubject) {
      currentSubject.lines.push(bullet[1].trim());
    } else if (currentSubject && line.length >= 6) {
      currentSubject.lines.push(line);
    }
  }

  return subjects
    .filter((s) => s.lines.length > 0)
    .map((s) => ({ ...s, lines: [...new Set(s.lines)] }));
}

function toEndOfDayISO(date) {
  const d = new Date(date);
  d.setHours(19, 0, 0, 0);
  return d.toISOString();
}

export function milestonesFromSyllabus(parsed, exams = []) {
  const milestones = [];
  for (const subject of parsed) {
    const match = exams.find(
      (e) => (e.subject || '').toLowerCase() === subject.name.toLowerCase() && new Date(e.exam_date) >= Date.now()
    ) || exams.find((e) => (e.subject || '').toLowerCase() === subject.name.toLowerCase());
    const examDate = match ? new Date(match.exam_date) : null;
    const total = subject.lines.length;
    for (let i = 0; i < total; i += 1) {
      let due;
      if (examDate) {
        // Spread chapters evenly over the days between now and the exam.
        const spanDays = Math.max(1, Math.floor((examDate.getTime() - Date.now()) / 86400000));
        const offset = Math.min(spanDays, Math.max(1, Math.floor((i / Math.max(1, total)) * spanDays)));
        due = toEndOfDayISO(new Date(Date.now() + offset * 86400000));
      } else {
        due = toEndOfDayISO(new Date(Date.now() + (i + 1) * 3 * 86400000));
      }
      milestones.push({
        title: `${subject.name} · Milestone ${i + 1}/${total}: ${subject.lines[i]}`,
        subject: subject.name,
        due_date: due,
        priority: 2,
        description: `Auto-created from syllabus import (${subject.lines.length} milestones).`,
      });
    }
  }
  return milestones;
}