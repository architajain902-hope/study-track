import { greeting } from './utils';

const MASCOT = 'Sati 🦉';

const WELCOME = [
  'Ready to make today count?',
  'Small steps every day build big dreams.',
  'Let\u2019s turn your goals into done-lists.',
  'I\u2019m here to keep you on track, champ!',
  'One task at a time — you\u2019ve got this.',
];

const STREAK_PRAISE = [
  'You\u2019re on fire! Streaks are built one day at a time.',
  'Consistency beats intensity. Keep showing up!',
  'Your future self is cheering for this streak.',
  'Wow — momentum is real. Don\u2019t stop now!',
];

const GOAL_MET = [
  'Goal smashed! Treat yourself — you earned it.',
  'That\u2019s the daily goal done. Legendary.',
  'Check, check, check. Beautiful work today.',
];

const COLD_STREAK = [
  'Every streak starts with day one. Start fresh today.',
  'It\u2019s okay to restart — showing up matters most.',
];

const OVERDUE_NUDGE = [
  'A couple of tasks are waiting on you. 5 quiet minutes can clear one.',
  'Late is better than never — pick the smallest overdue task first.',
];

const TASK_DONE = [
  'Done and dusted! +1 to today\u2019s goal.',
  'Nice work! One more win on the board.',
  'Beautiful. That task didn\u2019t stand a chance.',
];

const WEAK_TOPICS_ADVICE = (subject, topic) =>
  `Looks like \u201c${topic}\u201d in ${subject} is your weak spot. Revisit it 20 minutes today, then log a confidence update — we\u2019ll track the climb.`;

const EXAM_TIME = (subject, days) =>
  `${subject} is in ${days} day${days === 1 ? '' : 's'} — let\u2019s make a mini revision plan for it.`;

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function welcomeMessage(firstName) {
  return `${pick(WELCOME)} ${firstName ? firstName.split(' ')[0].replace(/[.]+$/, '') : 'friend'}!`;
}

export function streakMessage() {
  return pick(STREAK_PRAISE);
}

export function goalMetMessage() {
  return pick(GOAL_MET);
}

export function coldStreakMessage() {
  return pick(COLD_STREAK);
}

export function overdueMessage() {
  return pick(OVERDUE_NUDGE);
}

export function taskDoneMessage() {
  return pick(TASK_DONE);
}

export { greeting, MASCOT, EXAM_TIME, WEAK_TOPICS_ADVICE };