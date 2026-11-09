// ClassTrack backend — entry point.
// Loads env vars, mounts the API routes.
// Local dev:  npm run dev   (or: npm start) — connects to MongoDB, then listens.
// Vercel: api/index.js requires this file and exports the app; the DB connects
// lazily on the first API request (cached across warm invocations).
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

const authRoutes = require('./routes/auth');
const classRoutes = require('./routes/classes');
const studentRoutes = require('./routes/students');
const attendanceRoutes = require('./routes/attendance');
const gradeRoutes = require('./routes/grades');

const app = express();

// CORS: in development the Vite frontend runs on http://localhost:5173.
// In production set CLIENT_URL to the deployed frontend origin.
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' })); // JSON bodies only — CSV import arrives as a text field, not a file upload (see routes/students.js).

// Health check — handy for Render/Vercel deploy checks. Works without a DB connection.
app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'classtrack' }));

// Lazy DB connect: the first API request opens the Mongoose connection and the
// promise is cached, so warm serverless invocations reuse it. If the connect
// fails (e.g. MONGODB_URI not set yet), the promise is cleared so the next
// request retries instead of serving a dead connection forever.
let dbPromise = null;
async function ensureDB(req, res, next) {
  try {
    if (!dbPromise) dbPromise = connectDB();
    await dbPromise;
    next();
  } catch (err) {
    dbPromise = null;
    next(err);
  }
}

app.use('/api/auth', ensureDB, authRoutes);
app.use('/api/classes', ensureDB, classRoutes);
app.use('/api/students', ensureDB, studentRoutes);
app.use('/api/attendance', ensureDB, attendanceRoutes);
app.use('/api/grades', ensureDB, gradeRoutes);

// Central error handler: every route forwards errors with next(err) and lands here.
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Server error' });
});

module.exports = app;

// Local dev only: connect, then listen. (Vercel imports the app instead.)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`ClassTrack API listening on port ${PORT}`));
    })
    .catch((err) => {
      // Fail loudly if MongoDB is unreachable — a silent server with no DB is worse than no server.
      console.error('Failed to start: could not connect to MongoDB.');
      console.error(err.message);
      process.exit(1);
    });
}
