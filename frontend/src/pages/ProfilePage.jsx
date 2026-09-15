import { useState } from 'react';
import { useApp } from '../store/AppContext';
import PageShell from '../components/layout/PageShell';
import { initials } from '../lib/utils';

export default function ProfilePage() {
  const { profile, session, logout, updateProfile } = useApp();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [dailyGoal, setDailyGoal] = useState(profile?.daily_goal || 3);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const user = session?.user;

  const save = async () => {
    setSaving(true);
    setMsg('');
    try {
      await updateProfile({
        full_name: fullName.trim(),
        username: username.trim() || null,
        daily_goal: Number(dailyGoal),
      });
      setMsg('Profile saved ✓');
    } catch (err) {
      setMsg(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    await logout();
  };

  return (
    <PageShell title="Profile" subtitle="Settings">
      <div className="px-4 py-5 animate-pop space-y-5">
        {/* Avatar & email */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-lighter to-brand text-2xl font-bold text-[#0b141a]">
            {initials(fullName || user?.email)}
          </div>
          <div>
            <p className="text-[17px] font-semibold text-white">{user?.email}</p>
            <p className="text-[13px] text-[#8696a0]">Sati Vidisha Student</p>
          </div>
        </div>

        {/* Edit fields */}
        <div className="rounded-xl bg-surface-dark p-4 space-y-3 ring-1 ring-surface">
          <div>
            <label className="mb-1 block text-[13px] text-[#8696a0]">Full name</label>
            <input className="input-round" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-[13px] text-[#8696a0]">Username (optional)</label>
            <input className="input-round" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. arjun001" />
          </div>
          <div>
            <label className="mb-1 block text-[13px] text-[#8696a0]">Daily goal (tasks per day)</label>
            <input
              className="input-round"
              type="number"
              min={1}
              max={20}
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Math.max(1, Number(e.target.value) || 1))}
            />
            <p className="mt-1 text-[12px] text-[#8696a0]">
              You'll see your streak advance when you complete this many tasks in a day.
            </p>
          </div>
          {msg && <p className="text-[13px] text-brand-lighter">{msg}</p>}
          <button type="button" onClick={save} disabled={saving} className="btn-primary w-full py-2.5 text-sm">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

        {/* Danger zone */}
        <div className="rounded-xl bg-surface-dark p-4 ring-1 ring-surface">
          <p className="mb-3 font-medium text-[#8696a0]">Account</p>
          <button type="button" onClick={onLogout} className="btn-danger w-full py-2.5 text-sm">
            Log out
          </button>
        </div>
      </div>
    </PageShell>
  );
}