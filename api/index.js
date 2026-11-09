// api/index.js — Vercel serverless entry point for the whole Express backend.
// Vercel routes /api/* here (see vercel.json rewrites). The Express app is
// exported, not listened on — Vercel owns the port. The DB connects lazily
// on the first API request (see backend/server.js ensureDB).
const app = require('../backend/server');

module.exports = app;
