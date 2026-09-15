import { greeting, daysUntil } from './utils';

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

// Mascot emotional state — ties the owl's mood to streak consistency, energy,
// and deadline pressure so the character visibly co-regulates with the user.
export function mascotMood({ activeStreak = 0, daily, energy, examsSoon = false, overdueCount = 0 }) {
  if (overdueCount > 0) {
    return {
      face: '🙄',
      label: 'Deadline radar',
      message: "I can see those overdue tasks blinking at me. Pick the tiniest one — momentum beats perfection.",
    };
  }
  if (energy !== null && energy <= 4) {
    return {
      face: '😪',
      label: 'Low battery',
      message: 'Your cognitive battery is low. Rest 10 minutes, hydrate, then hit one small win.',
    };
  }
  if (examsSoon) {
    return {
      face: '🫡',
      label: 'Exam mode',
      message: 'Exams are closing in. I turned on my witty panic mode — time to get tactical.',
    };
  }
  if (activeStreak > 0 && daily?.completed >= daily?.goal && daily?.goal > 0) {
    return {
      face: '😄',
      label: 'Celebrating',
      message: 'Goal smashed today! I am doing a little owl dance. 🦉✨',
    };
  }
  if (activeStreak > 0) {
    return {
      face: '😊',
      label: 'Proud of you',
      message: `${activeStreak}-day streak and counting. Consistency is your superpower.`,
    };
  }
  return {
    face: '🙂',
    label: 'Ready when you are',
    message: 'New day, fresh streak. Tell me what we are crushing first.',
  };
}

const DEADLINE_WIT = [
  (subject, days) => `${subject} in ${days} day${days === 1 ? '' : 's'}? Relax, I keep snacks and wisdom. 📚🍿`,
  (subject, days) => `Plot twist: ${subject} is in ${days} day${days === 1 ? '' : 's'}. Time to stop acting surprised.`,
  (subject, days) => `${days} day${days === 1 ? '' : 's'}. That's plenty… if we start right now. ${subject} awaits.`,
  (subject, days) => `The ${subject} exam is ${days} day${days === 1 ? '' : 's'} out. I'd say 'no pressure' but we both know better. 😅`,
];

export function deadlineWit(subject, days) {
  return pick(DEADLINE_WIT)(subject, days);
}

// Adaptive deadline prompts — intensity scales with proximity and adapts the
// intervention (panic-mode → drills → cadence) plus a weak-topic hook.
const DEADLINE_TIERS = [
  {
    max: 2,
    lines: [
      (s) => `${s} lands in 48 hours or less. Emergency mode: hydrate, pick your 3 likeliest questions, tiny focus blocks. I'm your co-pilot. 🛩️`,
      (s) => `Under two days to ${s}. Forget 'relax' — we run 'focus in gear'. One mock, then fix what leaks.`,
      (s) => `${s} is knocking on the door. Turn the panic into a checklist of small wins — respond, don't react.`,
    ],
  },
  {
    max: 7,
    lines: [
      (s) => `${s} is a week out. One chapter a day plus one past-paper and you walk in calm. I'll count with you.`,
      (s) => `One week to ${s} — the perfect distance for mock runs. No more excuses, just drills.`,
    ],
  },
  {
    max: 14,
    lines: [
      (s) => `${s}? Two weeks is a luxury. Build the cadence now and revision almost does itself.`,
      (s) => `Early bird for ${s}. Set the rhythm this week so exam week feels like a lap, not a sprint.`,
    ],
  },
];

export function adaptiveDeadlineMessage(exam, weakTopic) {
  const days = Math.max(0, Math.round(daysUntil(exam.exam_date) || 0));
  const tier = DEADLINE_TIERS.find((t) => days <= t.max) || DEADLINE_TIERS[DEADLINE_TIERS.length - 1];
  let line = pick(tier.lines)(exam.subject);
  if (weakTopic) line += ` Start with ${weakTopic} — the charts say that's where marks leak.`;
  return line;
}

const LOW_ENERGY_REST = [
  'Low battery detected. A 10-minute walk + water = a brand-new brain. I will wait.',
  'Your focus meter is in the red. Even race cars pit-stop. Take a short breather.',
];

const UNLOCK_CHEER = (name) =>
  `${name} unlocked! That's what deep focus buys you. Check your closet.`;

export function lowEnergyRestMessage() {
  return pick(LOW_ENERGY_REST);
}

export function unlockCheerMessage(name) {
  return UNLOCK_CHEER(name);
}

export { greeting, MASCOT, EXAM_TIME, WEAK_TOPICS_ADVICE };