export default function handler(req, res) {
  const keys = Object.keys(process.env)
    .filter((k) => k.includes('SUPABASE') || k === 'VERCEL' || k.startsWith('VITE_'))
    .reduce((acc, k) => ({ ...acc, [k]: process.env[k] ? 'present' : 'empty' }), {});
  res.status(200).json({ ok: true, path: req.url || req.path, env: keys });
}