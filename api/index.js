// Vercel serverless entry point — fully self-contained Express app.
// Single file, no cross-file imports: Vercel compiles this one entrypoint
// from ESM to CJS and bundles the external npm deps. Keeping everything
// here avoids ESM/CJS interop issues when requiring ../backend from a
// transpiled serverless module.
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// ── Supabase Clients ──────────────────────────────────────────────────────
// Never throw at module load: a serverless cold start must stay responsive so
// we can surface diagnostics in the response body instead of a bare 500.
const envSnapshot = {
  url:     !!process.env.SUPABASE_URL,
  anon:    !!process.env.SUPABASE_ANON_KEY,
  service: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  vercel:  !!process.env.VERCEL,
};
console.error('[api] init', JSON.stringify(envSnapshot), 'node=' + process.version);

let supabaseReady     = false;
let supabaseInitError = null;
let supabaseAdmin     = null;

if (envSnapshot.url && envSnapshot.anon && envSnapshot.service) {
  try {
    supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    supabaseReady = true;
  } catch (err) {
    supabaseInitError = err.message;
    console.error('[api] createClient failed', err.message);
  }
} else {
  supabaseInitError = 'Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY';
}

// ── Middleware ─────────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  if (!supabaseReady) {
    return res.status(503).json({ error: 'Backend not initialized.', detail: supabaseInitError });
  }
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
  }
  const token = header.slice(7);

  // Create a scoped supabase client that verifies the JWT via supabase.auth.getUser
  const scoped = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
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
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    backend: 'ready',
    supabaseReady,
    supabaseInitError,
  });
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

// ── Global error handler ──────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[api] unhandled error', err?.message, err?.stack);
  res.status(500).json({ error: err?.message || 'Internal server error.' });
});

// ── Catch-all: 404 ────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

export default app;