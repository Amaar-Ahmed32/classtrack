// ClassTrack backend — entry point.
// Loads env vars, connects to MongoDB, mounts the API routes, starts the server.
// Run:  npm run dev   (or: npm start)
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

// Health check — handy for Render/Vercel deploy checks.
app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'classtrack' }));

app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades', gradeRoutes);

// Central error handler: every route forwards errors with next(err) and lands here.
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Server error' });
});

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
