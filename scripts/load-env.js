// Minimal .env loader for the repo root .env file (gitignored).
// Only sets variables that aren't already present in the environment,
// so real env vars always win. No dependencies.
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(import.meta.dirname, '..', '.env');
if (existsSync(envPath)) {
  for (const raw of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    if (!(key in process.env)) {
      process.env[key] = line.slice(eq + 1).trim();
    }
  }
}