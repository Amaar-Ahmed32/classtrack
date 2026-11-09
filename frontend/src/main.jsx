// App bootstrap: providers, router, service-worker registration, offline sync.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './i18n';
import { syncOutbox } from './offline/sync';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// PWA: register the service worker in production builds only (Vite serves it
// from /sw.js). Dev mode skips it so hot-reload is never cached.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((e) => {
      console.warn('Service worker registration failed:', e.message);
    });
  });
}

// Drain the offline outbox whenever connectivity returns (and once at startup).
window.addEventListener('online', () => syncOutbox());
syncOutbox();
