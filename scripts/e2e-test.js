// End-to-end verification of the ChatPlanner stack:
// signup, RLS isolation, task/exam CRUD, streak RPC, backend notifications.
import './load-env.js';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const API_URL = process.env.API_URL || 'http://localhost:4000';

if (!url || !anonKey) {
  console.error('Missing SUPABASE_URL / SUPABASE_ANON_KEY. Set them in .env or environment.');
  process.exit(1);
}

const stamp = Date.now();
const u1 = { email: `e2e.one.${stamp}@gmail.com`, password: 'e2epass123', full_name: 'E2E One' };
const u2 = { email: `e2e.two.${stamp}@gmail.com`, password: 'e2epass123', full_name: 'E2E Two' };

let pass = 0;
let fail = 0;
function check(name, cond, extra = '') {
  if (cond) { pass += 1; console.log(`  ✓ ${name}`); }
  else { fail += 1; console.error(`  ✗ ${name} ${extra}`); }
}

async function main() {
  const supabase = createClient(url, anonKey);
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secretKey) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY.'); process.exit(1); }
  // Create users via admin API (confirmed, no email sent) to avoid signup rate limiting.
  const adminCfg = { apikey: secretKey, Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' };
  const adminCreate = async (u) => {
    const res = await fetch(`${url}/auth/v1/admin/users`, {
      method: 'POST',
      headers: adminCfg,
      body: JSON.stringify({ email: u.email, password: u.password, email_confirm: true, user_metadata: { full_name: u.full_name } }),
    });
    return res.json();
  };

  console.log('1. Auth');
  let created = await adminCreate(u1);
  check('create user1', !!created.id, JSON.stringify(created));
  const user1Id = created.id;
  let r = await supabase.auth.signInWithPassword({ email: u1.email, password: u1.password });
  check('login user1', !r.error, JSON.stringify(r.error));
  const token1 = r.data.session.access_token;
  const c1 = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token1}` } } });

  created = await adminCreate(u2);
  check('create user2', !!created.id, JSON.stringify(created));
  const user2Id = created.id;
  r = await supabase.auth.signInWithPassword({ email: u2.email, password: u2.password });
  const token2 = r.data.session.access_token;
  const c2 = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token2}` } } });

  console.log('2. Signup trigger (profiles + streaks rows)');
  let p = await c1.from('profiles').select('id, full_name').eq('id', user1Id).single();
  check('profile row auto-created', !p.error && p.data.full_name === u1.full_name, JSON.stringify(p.error));
  let s = await c1.from('streaks').select('*').eq('user_id', user1Id).single();
  check('streak row auto-created', !s.error && s.data.current_streak === 0, JSON.stringify(s.error));

  console.log('3. RLS isolation');
  p = await c2.from('profiles').select('id').eq('id', user1Id);
  check('user2 cannot read user1 profile', !p.error && p.data.length === 0, JSON.stringify(p.data));
  const evilIns = await c2.from('tasks').insert({ user_id: user1Id, title: 'HACK' });
  const evilSel = await c2.from('tasks').select('id').eq('user_id', user1Id);
  check('user2 cannot insert user1 task', !!evilIns.error, JSON.stringify(evilIns));
  check('user2 cannot see user1 tasks', evilSel.data.length === 0);

  console.log('4. Task CRUD');
  const t = await c1.from('tasks').insert({
    user_id: user1Id, title: 'Math HW: ex 7.3', subject: 'Math',
    due_date: new Date(Date.now() + 24 * 3600 * 1000).toISOString(), priority: 1,
  }).select().single();
  check('create task', !t.error, JSON.stringify(t.error));
  const tUp = await c1.from('tasks').update({ is_completed: true, completed_at: new Date().toISOString() }).eq('id', t.data.id).select().single();
  check('update task', !tUp.error && tUp.data.is_completed === true, JSON.stringify(tUp.error));
  const tList = await c1.from('tasks').select('id');
  check('list tasks (1)', tList.data.length === 1, JSON.stringify(tList.data));
  const tDel = await c1.from('tasks').delete().eq('id', t.data.id);
  check('delete task', !tDel.error);

  // Create a pending task for the notifications check (leave it until after step 7)
  const pending = await c1.from('tasks').insert({
    user_id: user1Id, title: 'Read Physics Ch 5', subject: 'Physics',
    due_date: new Date(Date.now() + 12 * 3600 * 1000).toISOString(), priority: 2,
  }).select().single();

  console.log('5. Exam CRUD');
  const ex = await c1.from('exams').insert({
    user_id: user1Id, subject: 'Physics', exam_date: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(), notes: 'Ch 5-8',
  }).select().single();
  check('create exam', !ex.error, JSON.stringify(ex.error));
  await c1.from('exams').update({ notes: 'Ch 5-9' }).eq('id', ex.data.id);
  const exList = await c1.from('exams').select('id');
  check('list exams (1)', exList.data.length === 1);

  console.log('6. Streak RPC');
  // cleanup any existing completed_days for today in user1 (fresh user so none)
  const sk = await c1.from('tasks').insert({ user_id: user1Id, title: 'Streak seed', is_completed: true, completed_at: new Date().toISOString() }).select().single();
  const s1 = await c1.rpc('commit_daily_goal');
  check('streak becomes 1', s1.data === 1, JSON.stringify(s1));
  const s2 = await c1.rpc('commit_daily_goal');
  check('streak idempotent same day', s2.data === 1, JSON.stringify(s2));
  const sRow = await c1.from('streaks').select('current_streak, best_streak').eq('user_id', user1Id).single();
  check('streak persisted', sRow.data.current_streak === 1 && sRow.data.best_streak === 1, JSON.stringify(sRow.data));

  console.log('7. Backend notifications');
  const jwt = (await supabase.auth.signInWithPassword({ email: u1.email, password: u1.password })).data.session.access_token;
  const nt = await fetch(`${API_URL}/api/notifications`, { headers: { Authorization: `Bearer ${jwt}` } });
  const ntBody = await nt.json();
  check('GET /api/notifications 200', nt.ok, JSON.stringify(ntBody));
  const hasTask = ntBody.notifications?.some((n) => n.kind === 'task_due' && n.task.title === 'Read Physics Ch 5');
  const hasExam = ntBody.notifications?.some((n) => n.kind === 'exam_upcoming' && n.exam.subject === 'Physics');
  check('task_due notification present', !!hasTask, JSON.stringify(ntBody.notifications?.map((n) => n.kind)));
  check('exam_upcoming notification present', !!hasExam);

  console.log('8. Backend auth rejection');
  const bad = await fetch(`${API_URL}/api/notifications`);
  check('no token → 401', bad.status === 401);

  console.log('9. Backend profile');
  const me = await fetch(`${API_URL}/api/me`, { headers: { Authorization: `Bearer ${jwt}` } });
  const meBody = await me.json();
  check('GET /api/me 200', me.ok && meBody.profile?.id === user1Id, JSON.stringify(meBody));

  // Cleanup test data
  if (pending?.data?.id) await c1.from('tasks').delete().eq('id', pending.data.id);
  if (sk?.data?.id) await c1.from('tasks').delete().eq('id', sk.data.id);
  // Cleanup test users
  for (const uid of [user1Id, user2Id]) {
    await fetch(`${url}/auth/v1/admin/users/${uid}`, {
      method: 'DELETE',
      headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}` },
    });
  }
  console.log('\n--- Cleaned up test users ---');

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });