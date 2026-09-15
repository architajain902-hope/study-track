import { createClient } from '@supabase/supabase-js';

// The Supabase URL and anon/publishable key are designed to be public — they are
// embedded in every client bundle. Override via VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
// (e.g. if you point the app at a different project), otherwise these defaults apply.
const url = (import.meta.env.VITE_SUPABASE_URL) || 'https://vcsxmvtjrlqmyflnjvjl.supabase.co';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_7vfJksfDKEe9GjBJSxaQOw_Rh4fFndj';

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// On Vercel the Express backend is the same-origin serverless function at /api;
// in dev we talk to the local backend on :4000. Override with VITE_API_URL if needed.
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:4000');