// Applies every supabase/migrations/*.sql file to the Supabase project (in
// filename order) via the management API. Requires a management access token.
import { readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

import './load-env.js';

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!PROJECT_REF || !ACCESS_TOKEN) {
  console.error('Missing SUPABASE_PROJECT_REF / SUPABASE_ACCESS_TOKEN (set in .env or environment).');
  process.exit(1);
}

const dir = resolve(import.meta.dirname, '..', 'supabase', 'migrations');
const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

if (files.length === 0) {
  console.error('No SQL migrations found in supabase/migrations/.');
  process.exit(1);
}

for (const file of files) {
  const sql = readFileSync(resolve(dir, file), 'utf8');
  process.stdout.write(`Applying ${file} … `);
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error('FAILED', res.status);
    console.error(text.slice(0, 4000));
    process.exit(1);
  }
  console.log('ok');
}
console.log('\nAll migrations applied.');