import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// ── Supabase Clients ──────────────────────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL;
const anonKey    = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey || !serviceKey) {
  console.error('[backend] missing env', {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    VERCEL: !!process.env.VERCEL,
  });
  throw new Error('Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY in .env');
}
console.error('[backend] env OK', !!process.env.SUPABASE_URL, !!process.env.SUPABASE_ANON_KEY, !!process.env.SUPABASE_SERVICE_ROLE_KEY, 'vercel=' + !!process.env.VERCEL);

// Service-role client — full DB access, bypasses RLS. Server-side use only.
export const supabaseAdmin = createClient(supabaseUrl, serviceKey);

// ── Middleware ─────────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
  }
  const token = header.slice(7);

  // Create a scoped supabase client that verifies the JWT via supabase.auth.getUser
  const scoped = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  req.scoped = scoped;
  req.token  = token;

  // Verify the token and get user id
  supabaseAdmin.auth.getUser(token)
    .then(({ data, error }) => {
      if (error || !data.user) {
        return res.status(401).json({ error: 'Invalid or expired session.' });
      }
      req.userId = data.user.id;
      next();
    })
    .catch((err) => {
      console.error('getUser error', err);
      res.status(500).json({ error: 'Auth verification failed.' });
    });
}

// ── Express App ───────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

// ── Health ────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Get current user's profile ────────────────────────────────────────────
app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await req.scoped
      .from('profiles')
      .select('*')
      .eq('id', req.userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Profile not found.' });
    res.json({ profile: data });
  } catch (err) {
    console.error('GET /api/me error', err);
    res.status(500).json({ error: 'Failed to load profile.' });
  }
});

// ── Notifications: upcoming tasks + exams ─────────────────────────────────
app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const tasksDueSoon = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48h
    const examsSoon    = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7d

    const [{ data: tasks }, { data: exams }] = await Promise.all([
      req.scoped
        .from('tasks')
        .select('id, title, subject, due_date, priority')
        .eq('user_id', req.userId)
        .eq('is_completed', false)
        .not('due_date', 'is', null)
        .lte('due_date', tasksDueSoon.toISOString())
        .gte('due_date', now.toISOString())
        .order('due_date'),
      req.scoped
        .from('exams')
        .select('id, subject, exam_date, notes')
        .eq('user_id', req.userId)
        .gte('exam_date', now.toISOString())
        .lte('exam_date', examsSoon.toISOString())
        .order('exam_date'),
    ]);

    const notifications = [
      ...(tasks || []).map((t) => ({ kind: 'task_due', task: t })),
      ...(exams || []).map((e) => ({ kind: 'exam_upcoming', exam: e })),
    ];

    res.json({ notifications });
  } catch (err) {
    console.error('GET /api/notifications error', err);
    res.status(500).json({ error: 'Failed to load notifications.' });
  }
});

// ── Streak commit (server-side helper) ────────────────────────────────────
// Calls the commit_daily_goal() RPC using the user's JWT via the scoped client.
// This endpoint is optional — the frontend can also call rpc() directly — but
// demonstrates the backend integration pattern.
app.post('/api/streak/commit', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await req.scoped.rpc('commit_daily_goal');
    if (error) throw error;
    res.json({ streak: data });
  } catch (err) {
    console.error('POST /api/streak/commit error', err);
    res.status(500).json({ error: 'Failed to update streak.' });
  }
});

// ── Catch-all: 404 ────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

export default app;

// ── Start (local only; Vercel runs this module as a serverless function) ──
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`ChatPlanner backend running on http://localhost:${PORT}`);
    console.log(`CORS origin: ${CLIENT_ORIGIN}`);
  });
}