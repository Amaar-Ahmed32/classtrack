// Top navigation: links, Urdu toggle, offline-queue badge, logout.
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../i18n';
import { countQueued } from '../offline/outbox';

export default function Nav() {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useLang();
  const navigate = useNavigate();
  const [queued, setQueued] = useState(0);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const refresh = () => countQueued().then(setQueued).catch(() => {});
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    refresh();
    window.addEventListener('outbox-changed', refresh);
    window.addEventListener('outbox-synced', refresh);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('outbox-changed', refresh);
      window.removeEventListener('outbox-synced', refresh);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
        <Link to="/" className="text-lg font-bold text-teal-800">
          {t('appName')}
        </Link>
        <nav className="flex flex-wrap gap-1 text-sm">
          <Link className="rounded px-2 py-1 hover:bg-gray-100" to="/">{t('dashboard')}</Link>
          <Link className="rounded px-2 py-1 hover:bg-gray-100" to="/classes">{t('classes')}</Link>
          <Link className="rounded px-2 py-1 hover:bg-gray-100" to="/attendance">{t('attendance')}</Link>
          <Link className="rounded px-2 py-1 hover:bg-gray-100" to="/register">{t('register')}</Link>
        </nav>
        <div className="ms-auto flex items-center gap-2">
          {!online && (
            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
              Offline
            </span>
          )}
          {queued > 0 && (
            <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-800">
              {queued} {t('offlineQueue')}
            </span>
          )}
          <button className="btn-ghost !py-1.5" onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}>
            {t('language')}
          </button>
          <span className="hidden text-sm text-gray-500 sm:inline">{user?.name}</span>
          <button className="btn-ghost !py-1.5" onClick={handleLogout}>{t('logout')}</button>
        </div>
      </div>
    </header>
  );
}
