/* The wedding planner's notification handler. It does one job: show an RSVP alert when the site sends one, and open
   the planner when it's tapped. It saves no pages and touches no requests, so the planner always loads fresh.
   (Separate from the sports hub's /sw.js; this one only covers /plan/.) */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  let msg = {};
  try { msg = e.data ? e.data.json() : {}; } catch (x) { msg = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(msg.title || 'New RSVP', {
    body: msg.body || 'Someone just replied. Tap to see.',
    icon: '/plan/icon-192.png',
    badge: '/plan/icon-192.png',
    data: { url: msg.url || '/plan/' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || '/plan/', self.location.origin).href;
  e.waitUntil((async () => {
    const open = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const mine = open.find((c) => new URL(c.url).pathname.startsWith('/plan'));
    if (mine) return mine.focus();
    return self.clients.openWindow(url);
  })());
});
