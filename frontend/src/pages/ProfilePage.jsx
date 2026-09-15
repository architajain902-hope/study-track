import { useState } from 'react';
import { useApp } from '../store/AppContext';
import PageShell from '../components/layout/PageShell';
import { initials } from '../lib/utils';
import { useTheme } from '../lib/theme';
import { requestNotifPermission } from '../lib/useBrowserNotifications';

export default function ProfilePage() {
  const {
    profile, session, logout, updateProfile,
    tasks, exams, studyPlans, topics, testRecords, studySessions,
    addTask, addExam, addStudyPlan, addTopic, addTestRecord, addStudySession,
  } = useApp();
  const { theme, toggleTheme } = useTheme();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [dailyGoal, setDailyGoal] = useState(profile?.daily_goal || 3);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [backupMsg, setBackupMsg] = useState('');
  const [notifMsg, setNotifMsg] = useState('');
  const [notifyLevel, setNotifyLevel] = useState(profile?.notify_level || 'all');
  const [notifHour, setNotifHour] = useState(profile?.reminder_hour ?? 20);

  const notifSupported = typeof window !== 'undefined' && 'Notification' in window;
  const notifDenied = notifSupported && Notification.permission === 'denied';
  const notifGranted = notifSupported && Notification.permission === 'granted';

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

  const onEnableNotifs = async () => {
    const res = await requestNotifPermission();
    if (res === 'granted') {
      setNotifMsg('✅ Browser notifications are on.');
      await updateProfile({ notify_level: notifyLevel === 'none' ? 'browser' : notifyLevel, reminder_enabled: true });
    } else if (res === 'denied') {
      setNotifMsg('❌ Notifications were blocked by your browser.');
    } else {
      setNotifMsg('ℹ️ Browser notifications are not supported here.');
    }
  };

  const saveNotifPrefs = async () => {
    try {
      await updateProfile({ notify_level: notifyLevel, reminder_hour: Number(notifHour) });
      setNotifMsg('✅ Reminder preferences saved.');
    } catch (err) {
      setNotifMsg(`❌ ${err.message || 'Failed to save.'}`);
    }
  };

  const handleExport = () => {
    const payload = {
      app: 'satistudy',
      exportedAt: new Date().toISOString(),
      profile: {
        full_name: profile?.full_name || '',
        username: profile?.username || '',
        daily_goal: profile?.daily_goal || 3,
      },
      tasks, exams, studyPlans, topics, testRecords, studySessions,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `satistudy-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMsg('✅ Backup downloaded. Keep it somewhere safe.');
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.app !== 'satistudy' || !Array.isArray(data.tasks) || !Array.isArray(data.exams)) {
        return setBackupMsg('❌ Not a valid SatiStudy backup file.');
      }
      const strip = (arr) => (Array.isArray(arr) ? arr : []).map(({ id, user_id, created_at, updated_at, completed_at, ...rest }) => rest).filter(Boolean);
      const insertAll = async (items, fn) => { for (const it of items) { try { await fn(it); } catch { /* skip conflicts */ } } };
      await insertAll(strip(data.tasks), addTask);
      await insertAll(strip(data.exams), addExam);
      await insertAll(strip(data.studyPlans), addStudyPlan);
      await insertAll(strip(data.topics), addTopic);
      await insertAll(strip(data.testRecords), addTestRecord);
      await insertAll(strip(data.studySessions), addStudySession);
      setBackupMsg('✅ Backup restored. Your data is back!');
    } catch (err) {
      setBackupMsg(`❌ Import failed: ${err.message || 'invalid file'}`);
    }
  };

  return (
    <PageShell title="Profile" subtitle="Settings">
      <div className="px-4 py-5 animate-pop space-y-5">
        {/* Avatar & email */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-lighter to-brand text-2xl font-bold text-onbrand">
            {initials(fullName || user?.email)}
          </div>
          <div>
            <p className="text-[17px] font-semibold text-white">{user?.email}</p>
            <p className="text-[13px] text-muted">Sati Vidisha Student</p>
          </div>
        </div>

        {/* Edit fields */}
        <div className="rounded-xl bg-surface-dark p-4 space-y-3 ring-1 ring-surface">
          <div>
            <label className="mb-1 block text-[13px] text-muted">Full name</label>
            <input className="input-round" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-[13px] text-muted">Username (optional)</label>
            <input className="input-round" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. arjun001" />
          </div>
          <div>
            <label className="mb-1 block text-[13px] text-muted">Daily goal (tasks per day)</label>
            <input
              className="input-round"
              type="number"
              min={1}
              max={20}
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Math.max(1, Number(e.target.value) || 1))}
            />
            <p className="mt-1 text-[12px] text-muted">
              You'll see your streak advance when you complete this many tasks in a day.
            </p>
          </div>
          {msg && <p className="text-[13px] text-brand-lighter">{msg}</p>}
          <button type="button" onClick={save} disabled={saving} className="btn-primary w-full py-2.5 text-sm">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

        {/* Appearance */}
        <div className="rounded-xl bg-surface-dark p-4 ring-1 ring-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Appearance</p>
              <p className="text-[13px] text-muted">{theme === 'dark' ? 'Dark mode (classic)' : 'Light mode (warm)'}</p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="btn-secondary px-4 py-2 text-sm"
              title="Toggle light/dark theme"
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </div>

        {/* Notifications & reminders */}
        <div className="rounded-xl bg-surface-dark p-4 ring-1 ring-surface">
          <p className="mb-1 font-medium text-white">Reminders & notifications</p>
          <p className="mb-3 text-[12px] text-muted">Get nudged for due tasks and upcoming exams.</p>

          <label className="mb-1 block text-[12.5px] text-muted">Notify me via</label>
          <select
            className="input-round mb-3"
            value={notifyLevel}
            onChange={(e) => setNotifyLevel(e.target.value)}
          >
            <option value="all">Everything (in-app + browser)</option>
            <option value="inapp">In-app only</option>
            <option value="browser">Browser only</option>
            <option value="email">Email only</option>
            <option value="none">Off</option>
          </select>

          <label className="mb-1 block text-[12.5px] text-muted">Daily reminder hour</label>
          <input
            className="input-round mb-3"
            type="number"
            min={0}
            max={23}
            value={notifHour}
            onChange={(e) => setNotifHour(Number(e.target.value) || 20)}
          />

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={saveNotifPrefs} className="btn-primary px-4 py-2 text-sm">Save prefs</button>
            {notifSupported && (
              <button type="button" onClick={onEnableNotifs} className="btn-secondary px-4 py-2 text-sm">
                {notifGranted ? '🔔 On (browser)' : notifDenied ? '🔕 Blocked — unblock in settings' : '🔔 Turn on browser notifs'}
              </button>
            )}
          </div>
          {notifMsg && <p className={`mt-2 text-[12.5px] ${notifMsg.startsWith('❌') ? 'text-danger' : 'text-brand-lighter'}`}>{notifMsg}</p>}
        </div>

        {/* Backup & restore */}
        <div className="rounded-xl bg-surface-dark p-4 ring-1 ring-surface">
          <p className="mb-1 font-medium text-white">Data backup</p>
          <p className="mb-3 text-[12px] text-muted">
            Export everything in one file (tasks, exams, plans, topics, tests, study time). Import restores it into this account.
          </p>
          <div className="mb-3 flex gap-2">
            <button type="button" onClick={handleExport} className="btn-primary flex-1 py-2.5 text-sm">⬇️ Export</button>
            <label className="btn-secondary flex-1 cursor-pointer py-2.5 text-center text-sm">
              ⬆️ Import
              <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
            </label>
          </div>
          {backupMsg && (
            <p className={`text-[12.5px] ${backupMsg.startsWith('❌') ? 'text-danger' : 'text-brand-lighter'}`}>{backupMsg}</p>
          )}
        </div>

        {/* Danger zone */}
        <div className="rounded-xl bg-surface-dark p-4 ring-1 ring-surface">
          <p className="mb-3 font-medium text-muted">Account</p>
          <button type="button" onClick={onLogout} className="btn-danger w-full py-2.5 text-sm">
            Log out
          </button>
        </div>
      </div>
    </PageShell>
  );
}