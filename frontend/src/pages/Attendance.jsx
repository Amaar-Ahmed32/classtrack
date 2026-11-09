// One-tap attendance grid.
// Tap a student's status chip to cycle P → A → L → P. "Mark all present" sets
// the default fast path; then only exceptions need taps. Save works offline:
// if the browser is offline (or the request fails on the network), the payload
// goes into the IndexedDB outbox and syncs automatically when back online.
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useLang } from '../i18n';
import { queueAttendance } from '../offline/outbox';

const CYCLE = { P: 'A', A: 'L', L: 'P' };
const STYLES = {
  P: 'border-teal-600 bg-teal-600 text-white',
  A: 'border-red-500 bg-red-500 text-white',
  L: 'border-amber-500 bg-amber-500 text-white',
};
const today = () => new Date().toISOString().slice(0, 10);

export default function Attendance() {
  const { t } = useLang();
  const [params] = useSearchParams();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState(params.get('classId') || '');
  const [date, setDate] = useState(today());
  const [students, setStudents] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.classes.list().then((list) => {
      setClasses(list);
      if (!classId && list.length > 0) setClassId(list[0]._id);
    }).catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!classId) return;
    setNotice('');
    setError('');
    Promise.all([api.students.list(classId), api.attendance.getDay(classId, date)])
      .then(([studentList, day]) => {
        setStudents(studentList);
        const saved = {};
        day.records.forEach((r) => { saved[r.student] = r.status; });
        const initial = {};
        studentList.forEach((s) => { initial[s._id] = saved[s._id] || 'P'; });
        setStatuses(initial);
      })
      .catch((e) => setError(e.message));
  }, [classId, date]);

  function cycle(id) {
    setStatuses((prev) => ({ ...prev, [id]: CYCLE[prev[id] || 'P'] }));
  }

  function markAllPresent() {
    const all = {};
    students.forEach((s) => { all[s._id] = 'P'; });
    setStatuses(all);
  }

  async function save() {
    setError('');
    setNotice('');
    const payload = {
      classId,
      date,
      records: students.map((s) => ({ student: s._id, status: statuses[s._id] || 'P' })),
    };
    try {
      if (!navigator.onLine) throw new Error('offline');
      await api.attendance.saveDay(payload);
      setNotice(t('saved'));
    } catch (err) {
      // Network failure (or explicit offline) → queue, don't lose the register.
      if (!navigator.onLine || err instanceof TypeError || err.message === 'offline') {
        await queueAttendance(payload);
        setNotice(t('savedOffline'));
      } else {
        setError(err.message);
      }
    }
  }

  const counts = { P: 0, A: 0, L: 0 };
  students.forEach((s) => { counts[statuses[s._id] || 'P'] += 1; });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('attendance')}</h1>
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p className="rounded bg-teal-50 px-3 py-2 text-sm text-teal-800">{notice}</p>}

      <div className="flex flex-wrap gap-3">
        <select className="input !w-auto" value={classId} onChange={(e) => setClassId(e.target.value)}>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
              {c.section ? ` — ${c.section}` : ''}
            </option>
          ))}
        </select>
        <input className="input !w-auto" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="btn-ghost" onClick={markAllPresent}>Mark all present</button>
      </div>

      <p className="text-sm text-gray-500">
        Present: {counts.P} · Absent: {counts.A} · Leave: {counts.L} · Total: {students.length}
      </p>

      <div className="card divide-y !p-0">
        {students.map((s) => (
          <div key={s._id} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm">
              <span className="text-gray-400">{s.rollNo} · </span>
              {s.name}
            </span>
            <button
              className={`status-btn ${STYLES[statuses[s._id] || 'P']}`}
              onClick={() => cycle(s._id)}
              aria-label={`${s.name} status: ${statuses[s._id] || 'P'}. Tap to change.`}
            >
              {statuses[s._id] || 'P'}
            </button>
          </div>
        ))}
        {students.length === 0 && (
          <p className="px-4 py-3 text-sm text-gray-500">No students in this class yet — add some on the Classes page.</p>
        )}
      </div>

      <button className="btn-primary w-full sm:w-auto" onClick={save} disabled={!classId || students.length === 0}>
        {t('save')} attendance
      </button>
    </div>
  );
}
