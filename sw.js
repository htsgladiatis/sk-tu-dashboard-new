/* TU Dashboard Service Worker
 * Strategy: forced-network for navigations + same-origin GET (bypasses HTTP cache via cache:'reload')
 * so github.io CDN Age:600 cache can never pin us to a stale build.
 * Cache name is versioned so activation discards stale entries on each deploy.
 *
 * IMPORTANT: do NOT remove `cache: 'reload'`. Without it, github.io's
 * Cache-Control: max-age=600 pins returning visitors to whichever HTML was
 * current at first SW fetch — even after a fresh push lands the new file
 * on origin. Symptom: user sees OLD layout despite server already shipping NEW.
 */
const TU_CACHE = 'tu-dash-v2-2026-08-27-r3';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== TU_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Force fresh from network, ignoring HTTP Cache-Control. Fallback to cache when offline.
  event.respondWith(
    fetch(req, { cache: 'reload' })
      .then(response => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(TU_CACHE).then(cache => cache.put(req, clone)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(req))
  );
});
