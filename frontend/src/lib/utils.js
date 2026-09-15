import dayjs from 'dayjs';

export const PRIORITY_META = {
  1: { label: 'High', color: '#F15C6D', ring: 'border-[#F15C6D]' },
  2: { label: 'Medium', color: '#FFBE5C', ring: 'border-[#FFBE5C]' },
  3: { label: 'Low', color: '#25D366', ring: 'border-[#25D366]' },
};

export const RECURRENCE_LABELS = {
  none: 'Once',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export const TODAY = () => dayjs().format('YYYY-MM-DD');
export const LOCAL_DATE = (t) => dayjs(t).format('YYYY-MM-DD');

// Consistent "today" in IST (the college's local day) so streak boundaries
// match the server-side commit_daily_goal function regardless of device TZ.
const IST = 'Asia/Kolkata';
export function kolkataDateStr() {
  return new Date().toLocaleDateString('en-CA', { timeZone: IST });
}
export function kolkataYesterdayStr() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toLocaleDateString('en-CA', { timeZone: IST });
}
export function kolkataDayStartISO() {
  // Asia/Kolkata has a fixed UTC+05:30 (no DST), so IST midnight on date D
  // equals D-1 18:30 UTC — serialised as an ISO instant for `completed_at >=` queries.
  const [y, m, d] = kolkataDateStr().split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d - 1, 18, 30)).toISOString();
}

export function formatTime(t) {
  return dayjs(t).format('h:mm A');
}

export function formatDay(t) {
  const d = dayjs(t);
  const today = dayjs().startOf('day');
  const diff = d.startOf('day').diff(today, 'day');
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.format('ddd, MMM D');
}

export function formatFull(t) {
  return dayjs(t).format('ddd, MMM D · h:mm A');
}

export function daysUntil(t) {
  return dayjs(t).startOf('day').diff(dayjs().startOf('day'), 'day');
}

export function dueLabel(t) {
  const diff = daysUntil(t);
  if (diff < 0) return `Overdue by ${-diff} day${-diff === 1 ? '' : 's'}`;
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  return `Due in ${diff} days`;
}

export function groupByDay(items) {
  const map = new Map();
  for (const item of items) {
    const key = LOCAL_DATE(item.date);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
}

export function sortFeed(items) {
  return [...items].sort((a, b) => (a.date && b.date ? +dayjs(a.date) - +dayjs(b.date) : 0));
}

export function isOverdue(t) {
  return dayjs().isAfter(dayjs(t));
}

export function daysAgoLabel(dateStr) {
  const diff = dayjs().startOf('day').diff(dayjs(dateStr).startOf('day'), 'day');
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${diff} days ago`;
}

export function greeting() {
  const h = dayjs().hour();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function initials(name) {
  return (name || 'S')
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();
}

export function monthCells(year, month) {
  const first = dayjs(`${year}-${month + 1}-01`);
  const start = first.startOf('week'); // Sunday
  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    cells.push(start.add(i, 'day'));
  }
  return cells;
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(pw) {
  return pw.length >= 6;
}

export function titleFromCommand(text) {
  return text.trim().replace(/^\/task\s+|\/t\s+/i, '').trim();
}

export function subjectFromLine(text) {
  const m = text.match(/subject:([\w\s.-]+)/i);
  return m ? m[1].trim() : null;
}

export function dueFromLine(text) {
  const m = text.match(/due:\s*([\d/.-]+)/i);
  if (!m) return null;
  const d = dayjs(m[1]);
  return d.isValid() ? d.toISOString() : null;
}