<<<<<<< HEAD
# ChatPlanner — SatiStudy Chat

> Your Sati Vidisha assignments, exams and daily goals — managed in one chat-inspired planner.

A WhatsApp-style study board for Sati Vidisha students. Tasks, exams, daily goals and streaks live in a familiar chat feed; students add items by typing a sentence or tapping the "+" icons.

## Tech Stack

| Layer      | Technology                                            | Role                                |
| ---------- | ----------------------------------------------------- | ----------------------------------- |
| Frontend   | React 18 + Vite 5 + Tailwind CSS 3                     | WhatsApp-style chat UI (mobile-first) |
| Backend    | Node.js + Express 4                                   | REST API: notifications, streak, profile |
| BaaS       | Supabase (PostgreSQL 17)                              | Database, Auth, RLS, Realtime        |
| Auth       | Supabase Auth (GoTrue, JWT)                           | Email/password login, email confirm  |
| Security   | Row Level Security (`auth.uid()`), JWT Bearer tokens   | Per-user data isolation              |
| DevOps     | Git / GitHub, Vercel                                  | Version control + deployment         |

## Architecture

```
React (Vercel)  ⇄  Supabase Auth / PostgREST  ⇄  PostgreSQL (RLS)
   │
   └─────────────⇄  Express API (Vercel / Render)  ⇄  Supabase
```

- The client talks to Supabase directly via `@supabase/supabase-js` with the **anon (publishable) key**. RLS guarantees a user only ever reads/writes their own rows.
- The Express backend holds no secrets beyond the service role key it needs for auth verification, and exposes `GET /api/notifications`, `POST /api/streak/commit`, `GET /api/me`, `GET /api/health`. The frontend degrades gracefully if the backend is unreachable.
- The streak engine lives in the database as a `SECURITY DEFINER` function (`commit_daily_goal`), so it is the single source of truth and safe to call from any client.

## Database Schema (all RLS-scoped to `auth.uid()`)

- `profiles` — id, full_name, username, daily_goal (default 3)
- `tasks` — title, description, subject, due_date, priority (1–3), recurrence, is_completed, completed_at
- `exams` — subject, exam_date, notes
- `streaks` — current_streak, best_streak, last_completed_date
- `completed_days` — per-day completion log (drives the heatmap)

A trigger mints `profiles` + `streaks` rows on signup. Realtime is enabled on the `public` schema so multi-device edits sync live.

## Features

**MVP (all built & tested)**
- Sign up / log in (Supabase Auth, email confirmation on by default)
- Task CRUD (title, description, subject, due date, priority, recurrence, complete/toggle/delete)
- Exam scheduler (subject, datetime, notes, countdown, "days left")
- Daily goal + streak tracker (auto-advances on first completion of the day, idempotent, best-streak tracked)
- Chat-style feed: date separators, bubbles, priority colour rail, due/overdue labels, streak + goal system messages
- WhatsApp-style composer with quick actions and `/task …` commands
- Calendar month view (dots on busy days, tap a day for its items)
- Stats page: active/best streak, completion %, 60-day heatmap, goal progress bar
- Task/Exam detail pages (edit, complete, delete)
- Profile & settings (name, username, daily goal, logout)
- Notifications bar (tasks due in 7 days, exams in 7 days)
- Realtime sync across open clients

**Backlog** — group chat, AI study coach, gamification badges, offline sync, calendar import.

## Project Layout

```
supabase/migrations/   SQL schema, triggers, RLS, streak function, realtime
frontend/              React + Vite + Tailwind app
  src/pages/           Login, Dashboard, Calendar, Stats, Task, Exam, Profile
  src/components/      layout/, chat/, forms/, ui/
  src/store/           AppContext (auth, data, realtime, actions)
  src/lib/             supabase client, utils
backend/               Express API (health, me, notifications, streak commit)
scripts/               apply-migration.js, verify-db.js, e2e-test.js, browser-test.py
```

## Local Setup

1. Install deps:
   ```bash
   npm install                # or: npm --prefix frontend install && npm --prefix backend install
   ```
2. Configure environment variables (copy the real values from `frontend/.env` and `backend/.env`):
   ```bash
   cp .env.example frontend/.env
   cp .env.example backend/.env
   ```
3. Apply the database schema to the Supabase project:
   ```bash
   node scripts/apply-migration.js        # supabase/migrations/tables.sql
   ```
   (Also run `fix_streak_fn.patch` migration content if upgrading from before the streak fix.)
4. Run:
   ```bash
   npm run frontend     # Vite dev server on :5173
   npm run backend      # Express API on :4000
   ```
5. Open http://localhost:5173 and sign up.

## Tests

```bash
node scripts/e2e-test.js         # 22 API checks: auth, RLS isolation, CRUD, streak RPC, notifications
python scripts/browser-test.py   # 12 browser checks (Playwright, needs chromium: python -m playwright install chromium)
node scripts/verify-db.js        # confirms tables + RLS policies exist
```

Start the backend before `e2e-test.js`; start the Vite server before `browser-test.py`.

## Security Notes

- `VITE_SUPABASE_ANON_KEY` (publishable) is safe in the client bundle.
- `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ACCESS_TOKEN` are **server-only** — never ship them to the browser. Add them as protected env vars in Vercel.
- RLS is configured with `auth.uid() = user_id` per table; the streak `SECURITY DEFINER` function re-checks `auth.uid()` and is `REVOKE`d from `public`.
- Email confirmation is left enabled; users must verify before first login (the signup screen explains this).
