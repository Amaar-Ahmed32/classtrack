# ClassTrack — build notes: working vs stubbed

## Working (real, end-to-end once MongoDB is connected)

- Teacher register / login / JWT access + refresh / `/me` (bcrypt-hashed passwords)
- Class CRUD, teacher-scoped on every query (a teacher can never touch another teacher's data)
- Student CRUD + CSV paste-import (upsert by rollNo within a class; bad rows reported, not dropped)
- Attendance: one-tap P/A/L grid, "mark all present", save/replace a day, monthly register matrix with P/A/L counts and attendance %
- Gradebook: upsert grade per student/subject/term, per-student totals + percentages on read
- Urdu toggle for login + navigation, with full-page RTL flip
- Offline: IndexedDB outbox queues attendance saves when offline or on network failure; nav badge shows queue size; `online` event + app start drain the queue via `sync.js`
- Service worker caches the app shell; API requests are never cached

## Stubbed / intentionally incomplete

- **WhatsApp sending (`backend/utils/whatsapp.js`):** LOG MODE. Absence alerts are printed to the backend console, never sent. No credentials exist anywhere in this repo. Wiring a real provider is a single-file change — see "Decisions needed".
- **Service-worker precache:** only `/`, `/index.html`, and the manifest are pre-cached; JS/CSS chunks cache on first visit (runtime branch). Good enough for the MVP demo; a Workbox precache manifest is the upgrade if installability matters.
- **PWA install icons:** `manifest.webmanifest` has no icon files yet (Chrome's install prompt needs 192px + 512px PNGs). Add them under `frontend/public/` and reference them in the manifest.
- **Refresh-token revocation:** refresh tokens are stateless (signature-verified only). Fine for an MVP; production would store hashed refresh tokens and rotate them.
- **Conflict UI:** offline sync is last-write-wins via the server upsert. There is no "two devices edited the same day" merge screen — acceptable because one teacher owns one register.
- **Gradebook UI:** the grades API is complete, but there is no grades page in the frontend yet — the MVP scope prioritized attendance + register. Add `src/pages/Grades.jsx` + a route to finish it.
- **Leave-day percentage rule:** attendance % = present / (present + absent + leave). Leave days count as marked days. If the school counts leave as excused (excluded from the denominator), change one line in `routes/attendance.js` and say so in the report.

## Decisions needed from Amaar

1. **WhatsApp provider (the big one):** Meta WhatsApp Cloud API (free tier, needs a Meta developer app + phone-number ID + access token + template approval for messages outside the 24h window) vs a paid gateway (cheaper setup, per-message cost). Until he picks, log mode stays on and alerts are demonstrable in the backend console.
2. **Phone number format:** parent numbers are stored as typed. For real WhatsApp delivery they must be international format without `+` (e.g. `923001234567`). Decide whether to normalize on input (recommended) or require it in the CSV.
3. **Leave-day percentage rule:** see above — confirm with a teacher colleague which rule the school actually uses.
4. **Deployment targets:** Render + Vercel + Atlas are the documented free path, but confirm before wiring `CLIENT_URL` / `VITE_API_URL`.
5. **Grades page:** build it now (small) or leave the API-only gradebook as a documented "next step" in the report?
