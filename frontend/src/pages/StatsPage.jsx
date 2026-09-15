import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useApp } from '../store/AppContext';
import PageShell from '../components/layout/PageShell';

function HeatmapDay({ date, count, active }) {
  const opacity = count === 0 ? 0 : Math.min(0.3 + count * 0.22, 1);
  return (
    <div
      title={`${date}: ${count} task${count === 1 ? '' : 's'} completed`}
      className={`h-3 w-3 rounded-sm ${active ? 'ring-1 ring-brand-lighter' : ''}`}
      style={{ backgroundColor: count > 0 ? `rgba(37,211,102,${opacity})` : '#111B21' }}
    />
  );
}

export default function StatsPage() {
  const { tasks, exams, streak, activeStreak, daily } = useApp();

  const totalCompleted = useMemo(() => tasks.filter((t) => t.is_completed).length, [tasks]);
  const totalPending = tasks.length - totalCompleted;
  const completionRate = tasks.length ? Math.round((totalCompleted / tasks.length) * 100) : 0;

  // Heatmap: last 60 days
  const heatmap = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      if (t.completed_at) {
        const day = dayjs(t.completed_at).format('YYYY-MM-DD');
        map[day] = (map[day] || 0) + 1;
      }
    }
    const cells = [];
    for (let i = 59; i >= 0; i -= 1) {
      const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      cells.push({ date: d, count: map[d] || 0 });
    }
    return cells;
  }, [tasks]);

  const weekLabels = useMemo(() => {
    // Show 8 labels: every 7 days
    const labels = [];
    for (let i = 59; i >= 0; i -= 7) {
      labels.push(dayjs().subtract(i, 'day').format('MMM D'));
    }
    return labels;
  }, []);

  return (
    <PageShell title="Stats" subtitle="Your progress">
      <div className="px-4 py-4 space-y-4 animate-pop">
        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center rounded-xl bg-surface-dark p-4 ring-1 ring-surface">
            <span className="text-3xl">🔥</span>
            <span className="mt-1 text-2xl font-bold text-white">{activeStreak}</span>
            <span className="text-[11.5px] text-[#8696a0]">Day streak</span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-surface-dark p-4 ring-1 ring-surface">
            <span className="text-3xl">🏆</span>
            <span className="mt-1 text-2xl font-bold text-white">{streak?.best_streak || 0}</span>
            <span className="text-[11.5px] text-[#8696a0]">Best streak</span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-surface-dark p-4 ring-1 ring-surface">
            <span className="text-3xl">📊</span>
            <span className="mt-1 text-2xl font-bold text-white">{completionRate}%</span>
            <span className="text-[11.5px] text-[#8696a0]">Complete</span>
          </div>
        </div>

        {/* Daily goal */}
        <div className="rounded-xl bg-surface-dark p-4 ring-1 ring-surface">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-medium text-white">Today's progress</p>
            <span className="chip bg-brand-light/25 text-brand-lighter">{daily.completed}/{daily.goal}</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-ink">
            <div
              className="h-full rounded-full bg-brand-lighter transition-all duration-500"
              style={{ width: `${Math.min(100, (daily.completed / daily.goal) * 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[12.5px] text-[#8696a0]">
            {daily.completed >= daily.goal
              ? '🎉 Goal met! Keep going!'
              : `${daily.goal - daily.completed} more task${daily.goal - daily.completed === 1 ? '' : 's'} to hit your goal.`}
          </p>
        </div>

        {/* Heatmap */}
        <div className="rounded-xl bg-surface-dark p-4 ring-1 ring-surface">
          <p className="mb-3 font-medium text-white">Last 60 days</p>
          <div className="overflow-x-auto">
            <div className="flex gap-[3px]">
              {heatmap.map((c) => (
                <HeatmapDay key={c.date} date={c.date} count={c.count} />
              ))}
            </div>
          </div>
          <div className="mt-2 flex gap-[3px]">
            {weekLabels.map((l) => (
              <span key={l} className="text-[9px] text-[#8696a0]" style={{ minWidth: '12px' }}>{l.split(' ')[1]}</span>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-[#8696a0]">
            <span>Less</span>
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: '#111B21' }} />
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: 'rgba(37,211,102,0.3)' }} />
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: 'rgba(37,211,102,0.6)' }} />
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: 'rgba(37,211,102,1)' }} />
            <span>More</span>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-xl bg-surface-dark p-4 ring-1 ring-surface">
          <p className="mb-3 font-medium text-white">Summary</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#8696a0]">Total tasks</span>
              <span className="text-white font-medium">{tasks.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8696a0]">Completed</span>
              <span className="text-brand-lighter font-medium">{totalCompleted}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8696a0]">Pending</span>
              <span className="text-[#aebac1] font-medium">{totalPending}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8696a0]">Exams scheduled</span>
              <span className="text-white font-medium">{exams.length}</span>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}