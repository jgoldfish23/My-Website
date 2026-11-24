/* Construction Mastery service worker — scoped to /construction-mastery/ only.
   Exists so Chrome treats this path as its own installable app, separate from
   Jamo Sports Hub (whose root /sw.js previously controlled the whole origin). */
const SCOPE_PREFIX = '/construction-mastery/';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(SCOPE_PREFIX)) return;
  // Network-only; localStorage holds game progress. SW is for PWA identity/control.
  event.respondWith(fetch(req));
});
