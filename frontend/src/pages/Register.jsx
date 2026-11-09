// Monthly register view: students × days matrix with per-student totals and %.
// Percentages come from the backend (see routes/attendance.js for the rule).
import { useEffect, useState } from 'react';
import { api } from '../api';
import { useLang } from '../i18n';

const thisMonth = () => new Date().toISOString().slice(0, 7);

export default function Register() {
  const { t } = useLang();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [month, setMonth] = useState(thisMonth());
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.classes.list().then((list) => {
      setClasses(list);
      if (list.length > 0) setClassId(list[0]._id);
    }).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!classId || !month) return;
    api.attendance.register(classId, month)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [classId, month]);

  const cellColor = (mark) =>
    mark === 'P' ? 'text-teal-700' : mark === 'A' ? 'font-bold text-red-600' : mark === 'L' ? 'text-amber-600' : 'text-gray-300';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('register')}</h1>
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <select className="input !w-auto" value={classId} onChange={(e) => setClassId(e.target.value)}>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
              {c.section ? ` — ${c.section}` : ''}
            </option>
          ))}
        </select>
        <input className="input !w-auto" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>

      {data && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pe-4">Student</th>
                {data.days.map((d) => (
                  <th key={d} className="px-1 py-2 text-center font-normal text-gray-500">
                    {d.slice(8, 10)}
                  </th>
                ))}
                <th className="px-2 py-2 text-center">P</th>
                <th className="px-2 py-2 text-center">A</th>
                <th className="px-2 py-2 text-center">L</th>
                <th className="px-2 py-2 text-center">%</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.student._id} className="border-b last:border-0">
                  <td className="py-2 pe-4">
                    <span className="text-gray-400">{row.student.rollNo} · </span>
                    {row.student.name}
                  </td>
                  {data.days.map((d) => (
                    <td key={d} className={`px-1 py-2 text-center ${cellColor(row.marks[d])}`}>
                      {row.marks[d] || '–'}
                    </td>
                  ))}
                  <td className="px-2 py-2 text-center">{row.present}</td>
                  <td className="px-2 py-2 text-center">{row.absent}</td>
                  <td className="px-2 py-2 text-center">{row.leave}</td>
                  <td className="px-2 py-2 text-center font-semibold">
                    {row.percentage === null ? '–' : `${row.percentage}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.rows.length === 0 && (
            <p className="py-3 text-sm text-gray-500">No students in this class yet.</p>
          )}
          {data.days.length === 0 && data.rows.length > 0 && (
            <p className="py-3 text-sm text-gray-500">No attendance marked in this month yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
