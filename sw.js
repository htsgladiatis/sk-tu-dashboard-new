/* TU Dashboard Service Worker
 * Strategy: network-first for all same-origin GET requests; cache fallback when offline.
 * Cross-origin (Chart.js CDN, Google Fonts) passes through untouched.
 * Cache name is versioned so activation discards stale entries on each deploy.
 */
const TU_CACHE = 'tu-dash-v1';

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
  event.respondWith(
    fetch(req)
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
