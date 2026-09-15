import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { initials } from '../../lib/utils';

export default function AppHeader({ title, subtitle }) {
  const { profile, activeStreak, notifications } = useApp();
  const navigate = useNavigate();
  const hasAlerts = notifications.length > 0;

  return (
    <header className="whatsapp-header sticky top-0 z-20">
      <Link to="/" className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-lighter to-brand text-sm font-bold text-[#0b141a]">
          {initials(profile?.full_name)}
        </div>
      </Link>
      <button type="button" onClick={() => navigate('/')} className="flex-1 text-left">
        <p className="text-[16px] font-semibold leading-tight text-white">{title}</p>
        <p className="text-xs text-[#8696a0]">{subtitle}</p>
      </button>

      <div className="flex items-center gap-2">
        {activeStreak > 0 && (
          <div
            className="chip bg-brand-light/25 text-brand-lighter"
            title={`${activeStreak} day streak`}
          >
            <span className="text-sm">🔥</span>
            <span className="font-bold">{activeStreak}</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => navigate('/stats')}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#aebac1] hover:bg-surface"
          title="Streaks & stats"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 3v18h18" />
            <rect x="7" y="10" width="3" height="7" rx="1" fill="currentColor" stroke="none" />
            <rect x="12" y="6" width="3" height="11" rx="1" fill="currentColor" stroke="none" />
            <rect x="17" y="13" width="3" height="4" rx="1" fill="currentColor" stroke="none" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#aebac1] hover:bg-surface"
          title="Settings"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
          </svg>
          {hasAlerts && (
            <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-brand-lighter ring-2 ring-surface-dark" />
          )}
        </button>
      </div>
    </header>
  );
}