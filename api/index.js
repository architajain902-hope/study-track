// Vercel serverless entry point — mounts the Express backend at /api.
// Vercel routes every /api/* request to this function with the full path,
// so the app's existing /api/... routes match directly.
import app from '../backend/index.js';

export default app;