// ClassTrack service worker — app-shell + runtime caching skeleton.
// Strategy:
//   • API requests (/api/*) always go to the network — never serve stale data.
//   • Same-origin page/asset requests are cache-first with network fallback,
//     so the app shell opens offline and attendance can be queued (see outbox.js).
// LIMIT: Vite build assets are hashed, but this worker only pre-caches '/' and
// '/index.html'; JS/CSS chunks are cached on first visit via the runtime branch.
// That is enough for the MVP demo; a Workbox-based precache is the upgrade path.
const CACHE = 'classtrack-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(['/', '/index.html', '/manifest.webmanifest']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (url.pathname.startsWith('/api')) return; // API: network only, no cache
  if (url.origin !== self.location.origin) return; // third-party: leave alone

  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        })
    )
  );
});
