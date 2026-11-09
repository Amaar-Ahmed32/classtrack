// Dashboard: counts + today's attendance at a glance + shortcuts.
// Kept deliberately light — the register and attendance pages do the real work.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useLang } from '../i18n';

export default function Dashboard() {
  const { t } = useLang();
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.classes.list().then(setClasses).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('dashboard')}</h1>
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-gray-500">{t('classes')}</p>
          <p className="mt-1 text-3xl font-bold">{classes.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">{t('attendance')}</p>
          <Link className="mt-1 inline-block text-sm font-medium text-teal-700 underline" to="/attendance">
            Mark today's attendance →
          </Link>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">{t('register')}</p>
          <Link className="mt-1 inline-block text-sm font-medium text-teal-700 underline" to="/register">
            View monthly register →
          </Link>
        </div>
      </div>
      <div className="card">
        <h2 className="font-semibold">{t('classes')}</h2>
        {classes.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            No classes yet — create one on the Classes page, then add students.
          </p>
        ) : (
          <ul className="mt-2 divide-y">
            {classes.map((c) => (
              <li key={c._id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {c.name}
                  {c.section ? ` — ${c.section}` : ''}
                  <span className="text-gray-400"> {c.academicYear}</span>
                </span>
                <Link className="text-teal-700 underline" to={`/attendance?classId=${c._id}`}>
                  Take attendance
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
