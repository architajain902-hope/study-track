import dayjs from 'dayjs';
import { daysUntil } from '../../lib/utils';

export default function ExamTicker({ exams }) {
  const upcoming = exams
    .map((e) => ({ exam: e, days: daysUntil(e.exam_date) }))
    .filter((x) => x.days >= 0)
    .sort((a, b) => a.days - b.days);
  if (!upcoming.length) return null;

  const strip = upcoming
    .map(({ exam, days }) => `${exam.subject} — ${days === 0 ? 'TODAY' : `T-${days}d`}`)
    .join('  ✦  ');

  return (
    <div className="mb-3 overflow-hidden rounded-lg border border-white/10 bg-surface-dark/50 px-0 py-1.5 backdrop-blur">
      <div className="animate-marquee flex w-max whitespace-nowrap">
        <span className="px-3 text-[12px] tracking-wide text-warn-muted">{strip}  ✦  </span>
        <span aria-hidden="true" className="px-3 text-[12px] tracking-wide text-warn-muted">{strip}  ✦  </span>
      </div>
    </div>
  );
}