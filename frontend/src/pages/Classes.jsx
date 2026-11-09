// Classes + students management, including CSV roster import.
// CSV format (paste into the textarea, header row optional):
//   name,rollNo,parentName,parentPhone
//   Ahmed Ali,1,Imran Ali,923001234567
import { useEffect, useState } from 'react';
import { api } from '../api';
import { useLang } from '../i18n';

export default function Classes() {
  const { t } = useLang();
  const [classes, setClasses] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [students, setStudents] = useState([]);
  const [newClass, setNewClass] = useState({ name: '', section: '', academicYear: '' });
  const [newStudent, setNewStudent] = useState({ name: '', rollNo: '', parentName: '', parentPhone: '' });
  const [csv, setCsv] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function loadClasses() {
    const list = await api.classes.list();
    setClasses(list);
    if (list.length > 0 && !selectedId) setSelectedId(list[0]._id);
  }

  async function loadStudents(classId) {
    if (!classId) return;
    setStudents(await api.students.list(classId));
  }

  useEffect(() => {
    loadClasses().catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedId) loadStudents(selectedId).catch((e) => setError(e.message));
  }, [selectedId]);

  async function createClass(e) {
    e.preventDefault();
    setError('');
    try {
      await api.classes.create(newClass);
      setNewClass({ name: '', section: '', academicYear: '' });
      await loadClasses();
      setNotice(t('saved'));
    } catch (err) {
      setError(err.message);
    }
  }

  async function createStudent(e) {
    e.preventDefault();
    setError('');
    try {
      await api.students.create({ ...newStudent, classId: selectedId });
      setNewStudent({ name: '', rollNo: '', parentName: '', parentPhone: '' });
      await loadStudents(selectedId);
      setNotice(t('saved'));
    } catch (err) {
      setError(err.message);
    }
  }

  async function importCSV() {
    setError('');
    setNotice('');
    try {
      const res = await api.students.importCSV(selectedId, csv);
      setNotice(
        `Imported: ${res.inserted} new, ${res.updated} updated` +
          (res.errors.length ? ` — ${res.errors.length} rows skipped (${res.errors.join('; ')})` : '')
      );
      setCsv('');
      await loadStudents(selectedId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteClass(id) {
    if (!window.confirm('Delete this class and ALL its students, attendance and grades?')) return;
    await api.classes.remove(id);
    setSelectedId('');
    await loadClasses();
  }

  async function deleteStudent(id) {
    await api.students.remove(id);
    await loadStudents(selectedId);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('classes')}</h1>
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p className="rounded bg-teal-50 px-3 py-2 text-sm text-teal-800">{notice}</p>}

      <div className="card">
        <h2 className="font-semibold">New class</h2>
        <form className="mt-3 grid gap-3 sm:grid-cols-4" onSubmit={createClass}>
          <input className="input" placeholder="Name, e.g. Grade 8" value={newClass.name} onChange={(e) => setNewClass({ ...newClass, name: e.target.value })} required />
          <input className="input" placeholder="Section, e.g. A" value={newClass.section} onChange={(e) => setNewClass({ ...newClass, section: e.target.value })} />
          <input className="input" placeholder="Year, e.g. 2026-27" value={newClass.academicYear} onChange={(e) => setNewClass({ ...newClass, academicYear: e.target.value })} />
          <button className="btn-primary">{t('add')}</button>
        </form>
      </div>

      {classes.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <select className="input !w-auto" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                  {c.section ? ` — ${c.section}` : ''}
                </option>
              ))}
            </select>
            <button className="btn-ghost" onClick={() => deleteClass(selectedId)}>
              {t('delete')} class
            </button>
          </div>

          <div className="card">
            <h2 className="font-semibold">Add student</h2>
            <form className="mt-3 grid gap-3 sm:grid-cols-5" onSubmit={createStudent}>
              <input className="input" placeholder="Name" value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} required />
              <input className="input" placeholder="Roll no." value={newStudent.rollNo} onChange={(e) => setNewStudent({ ...newStudent, rollNo: e.target.value })} required />
              <input className="input" placeholder="Parent name" value={newStudent.parentName} onChange={(e) => setNewStudent({ ...newStudent, parentName: e.target.value })} />
              <input className="input" placeholder="Parent phone" value={newStudent.parentPhone} onChange={(e) => setNewStudent({ ...newStudent, parentPhone: e.target.value })} />
              <button className="btn-primary">{t('add')}</button>
            </form>
          </div>

          <div className="card">
            <h2 className="font-semibold">Import roster (CSV paste)</h2>
            <p className="mt-1 text-xs text-gray-500">name,rollNo,parentName,parentPhone — one student per line.</p>
            <textarea className="input mt-3 font-mono" rows={5} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={'name,rollNo,parentName,parentPhone\nAhmed Ali,1,Imran Ali,923001234567'} />
            <button className="btn-primary mt-3" onClick={importCSV} disabled={!csv.trim()}>
              Import
            </button>
          </div>

          <div className="card">
            <h2 className="font-semibold">Students ({students.length})</h2>
            <ul className="mt-2 divide-y">
              {students.map((s) => (
                <li key={s._id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    <span className="text-gray-400">{s.rollNo} · </span>
                    {s.name}
                    {s.parentName ? <span className="text-gray-500"> — {s.parentName}</span> : ''}
                  </span>
                  <button className="text-red-600 underline" onClick={() => deleteStudent(s._id)}>
                    {t('delete')}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
