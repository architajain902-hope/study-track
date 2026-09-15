import './load-env.js';
import { resolve } from 'path';

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!PROJECT_REF || !ACCESS_TOKEN) {
  console.error('Missing SUPABASE_PROJECT_REF / SUPABASE_ACCESS_TOKEN. Set them in .env or environment.');
  process.exit(1);
}

async function q(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 2000)}`);
  return res.json();
}

(async () => {
  const tables = await q(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name NOT LIKE '\\_%' ORDER BY table_name`);
  console.log('TABLES:', tables.map((r) => r.table_name).join(', '));

  const policies = await q(`SELECT tablename, policyname FROM pg_policies WHERE schemaname='public' ORDER BY tablename, policyname`);
  console.log('\nRLS POLICIES:');
  for (const p of policies) console.log(`  ${p.tablename}: ${p.policyname}`);

  const rls = await q(`SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('profiles','tasks','exams','streaks','completed_days')`);
  console.log('\nRLS ENABLED:');
  for (const r of rls) console.log(`  ${r.relname}: ${r.relrowsecurity}`);
})().catch((e) => { console.error(e); process.exit(1); });