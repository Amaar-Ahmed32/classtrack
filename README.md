# ClassTrack — Teacher's Daily Toolkit

**Problem:** Teachers in Pakistani schools take attendance on paper registers; absences surface too late and parent communication depends on word of mouth. School wifi is unreliable, so the tool must work offline.

**Solution (MERN capstone MVP, project 2 of 2 — see `../your_files/mern-capstone-roadmap.md`):** a teacher logs in, manages classes and student rosters (including CSV paste-import), marks attendance with one tap per student, views a monthly register with percentages, and — when online — parents of absent students get a WhatsApp alert. Attendance marked offline is queued in the browser and syncs automatically when connectivity returns.

## Stack

| Layer | Tech |
|---|---|
| Database | MongoDB Atlas (free tier) via Mongoose |
| Backend | Node + Express, JWT access + refresh tokens, role guard (`teacher`) |
| Frontend | React + Vite + Tailwind CSS, React Router |
| Offline | Service worker (app shell) + IndexedDB outbox |
| i18n | English / Urdu toggle (RTL flip included), no library |

## Project layout

```
classtrack/
├── backend/            # Express API (port 5000)
│   ├── server.js       # entry: env, DB, routes, error handler
│   ├── config/db.js    # Mongoose connect (MONGODB_URI only)
│   ├── middleware/auth.js   # JWT protect + requireRole + token signing
│   ├── models/         # User, Class, Student, AttendanceDay, Grade
│   ├── routes/         # auth, classes, students, attendance, grades
│   └── utils/          # dates, csv parser, whatsapp hook (log mode)
├── frontend/           # Vite React app (port 5173)
│   ├── public/sw.js    # service worker + manifest.webmanifest
│   └── src/
│       ├── api.js      # fetch client with refresh-token retry
│       ├── i18n.jsx    # en/ur translations + RTL
│       ├── context/AuthContext.jsx
│       ├── offline/    # outbox.js (IndexedDB) + sync.js (drain loop)
│       ├── components/Nav.jsx
│       └── pages/      # Login, Dashboard, Classes, Attendance, Register
├── README.md           # this file
└── NOTES.md            # what works vs what is stubbed
```

## Run it (development)

**Prerequisites:** Node 18+ and npm. A MongoDB Atlas cluster (free) — or a local `mongod`.

```bash
# 1. Backend
cd classtrack/backend
npm install
cp .env.example .env
# Edit .env: set MONGODB_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
# (generate secrets: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
npm run dev          # API on http://localhost:5000

# 2. Frontend (new terminal)
cd classtrack/frontend
npm install
npm run dev          # app on http://localhost:5173, /api proxied to :5000
```

Open http://localhost:5173 → **Create account** → create a class → add students (or paste a CSV roster) → mark attendance → view the Register page.

**CSV roster format** (header row optional):
```
name,rollNo,parentName,parentPhone
Ahmed Ali,1,Imran Ali,923001234567
Fatima Noor,2,Aslam Noor,923001234568
```

## API quick reference

| Method & path | Purpose | Auth |
|---|---|---|
| POST `/api/auth/register` | Create teacher account | Public |
| POST `/api/auth/login` | Login, returns tokens | Public |
| POST `/api/auth/refresh` | Fresh token pair | Refresh token |
| GET `/api/auth/me` | Current teacher | Bearer |
| GET/POST `/api/classes` · PUT/DELETE `/api/classes/:id` | Class CRUD (owner-scoped) | Teacher |
| GET `/api/students?classId=` · POST `/api/students` · PUT/DELETE `/api/students/:id` | Student CRUD | Teacher |
| POST `/api/students/import` `{classId, csv}` | CSV roster upsert by rollNo | Teacher |
| POST `/api/attendance` `{classId, date, records}` | Save/replace a day's register (fires absence alerts) | Teacher |
| GET `/api/attendance/:classId/day?date=` | One day's register | Teacher |
| GET `/api/attendance/:classId/register?month=YYYY-MM` | Monthly matrix + percentages | Teacher |
| GET `/api/grades?classId=&term=` · POST `/api/grades` · DELETE `/api/grades/:id` | Gradebook + per-student totals | Teacher |

## Deploy (free tiers)

- **Database:** MongoDB Atlas — allow network access from `0.0.0.0/0` (or Render's IPs), copy the connection string into the backend env.
- **Backend:** Render Web Service — root `classtrack/backend`, build `npm install`, start `npm start`, env vars from `.env.example` (set `CLIENT_URL` to the Vercel URL).
- **Frontend:** Vercel — root `classtrack/frontend`, build `npm run build`, output `dist`, env `VITE_API_URL=https://<your-render-service>.onrender.com`.

## Viva talking points

1. **Why one document per class per day?** Attendance is a daily snapshot; a single upsert replaces the whole register, so re-saving can never duplicate a day (unique index on class + date).
2. **JWT refresh flow:** short-lived access token + 7-day refresh token; the frontend retries once on 401 after refreshing (`src/api.js`).
3. **Offline strategy:** service worker caches the shell; attendance writes go to an IndexedDB outbox and sync on the `online` event; server-side upsert makes sync last-write-wins, which is correct for one teacher owning one register.
4. **WhatsApp hook:** one integration point (`backend/utils/whatsapp.js`) — log mode today, provider swap tomorrow, zero changes at call sites.
