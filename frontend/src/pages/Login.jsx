// Login / register page. One form, toggled mode — keeps the MVP to one route.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../i18n';

export default function Login() {
  const { login, register } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', schoolName: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="card">
        <h1 className="text-2xl font-bold text-teal-800">{t('appName')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('tagline')}</p>
        <h2 className="mt-6 text-lg font-semibold">
          {mode === 'login' ? t('welcomeBack') : t('createAccount')}
        </h2>
        <form className="mt-4 space-y-3" onSubmit={submit}>
          {mode === 'register' && (
            <>
              <input className="input" name="name" placeholder={t('name')} value={form.name} onChange={update} required />
              <input className="input" name="schoolName" placeholder={t('school')} value={form.schoolName} onChange={update} />
            </>
          )}
          <input className="input" name="email" type="email" placeholder={t('email')} value={form.email} onChange={update} required />
          <input className="input" name="password" type="password" placeholder={t('password')} value={form.password} onChange={update} required minLength={6} />
          {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {mode === 'login' ? t('login') : t('createAccount')}
          </button>
        </form>
        <button
          className="mt-4 w-full text-center text-sm text-teal-700 underline"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? t('noAccount') : t('haveAccount')}
        </button>
      </div>
    </div>
  );
}
