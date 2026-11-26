/* Jamo Sports Hub service worker (2026-11-10, Jamo picked "Opens like an app"). sports-hub/build.sh publishes it at
   /sw.js; /sports/app.js registers it. It only touches the sports pages (/sports, /cfb, /nfl, /nba, /cbb) - the rest of
   djgolding.com goes straight to the network as before - and it never touches the live-score feeds (/api/...), so live
   scores always come from the network.
   - Pages: fresh from the network first. With no connection, or after 4 seconds with no answer, the last saved copy,
     marked with the time it was saved so the page can say "Showing the copy saved at 2:14 PM".
   - Files whose address carries a version (?v=...) and the hubs' data blocks (/cfb/d/...): the saved copy (they never
     change; a new version has a new address). The older version of the same file is dropped when a new one is saved.
   - Logos and icons: the saved copy at once, refreshed in the background.
   - Everything else (data .json files and the like): the network first, the saved copy only when offline.
   To switch it off for everyone: set OFF = true below and publish. It then deletes its saved copies, removes itself and
   reloads any open sports page. (One phone only: localStorage "jsh-sw" = "off", which app.js honors.) */
const OFF = false;
const V = 'jsh-1';
const PAGES = V + '-pages', FILES = V + '-files';
const HUB = /^\/(sports|cfb|nfl|nba|cbb)(\/|$)/;
const WAIT_MS = 4000;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter((k) => k.startsWith('jsh-') && (OFF || !k.startsWith(V + '-'))).map((k) => caches.delete(k)));
  if (OFF) {
    await self.registration.unregister();
    const open = await self.clients.matchAll({ type: 'window' });
    open.forEach((c) => { try { c.navigate(c.url); } catch (x) {} });
    return;
  }
  await self.clients.claim();
})()));

self.addEventListener('fetch', (e) => {
  if (OFF) return;
  const r = e.request;
  if (r.method !== 'GET') return;
  let u;
  try { u = new URL(r.url); } catch (x) { return; }
  if (u.origin !== self.location.origin || u.pathname.startsWith('/api/') || !HUB.test(u.pathname)) return;
  if (r.mode === 'navigate') { e.respondWith(page(e, u)); return; }
  if (u.searchParams.has('v') || /^\/(cfb|nfl|nba|cbb)\/d\//.test(u.pathname)) { e.respondWith(kept(e, r, u)); return; }
  if (/\.(png|svg|webp|jpe?g|gif|ico|woff2?)$/i.test(u.pathname)) { e.respondWith(quick(e, r)); return; }
  e.respondWith(netFirst(r));
});

/* a page: the network first, the saved copy when the network is down or slow */
async function page(e, u) {
  const key = u.origin + u.pathname;
  const cache = await caches.open(PAGES);
  const net = fetch(e.request).then(async (res) => {
    if (res && res.ok && res.type === 'basic') {
      const body = await res.clone().arrayBuffer();
      const h = new Headers(res.headers);
      h.set('x-jsh-saved', String(Date.now()));
      await cache.put(key, new Response(body, { status: 200, headers: h }));
    }
    return res;
  });
  e.waitUntil(net.catch(() => {}));
  let timer;
  const slow = new Promise((ok) => { timer = setTimeout(ok, WAIT_MS, 'slow'); });
  let first = null;
  try { first = await Promise.race([net, slow]); } catch (x) { first = null; }
  clearTimeout(timer);
  if (first && first !== 'slow' && first.status < 500) return first;
  const saved = await cache.match(key);
  if (saved) return marked(saved);
  return first && first !== 'slow' ? first : net;
}

/* the saved copy of a page, with the time it was saved (window.__jshSaved, read by app.js) */
async function marked(res) {
  const ts = +res.headers.get('x-jsh-saved') || 0;
  const text = await res.text();
  const tag = '<script>window.__jshSaved=' + ts + '</script>';
  const out = /<head[^>]*>/i.test(text) ? text.replace(/<head[^>]*>/i, (m) => m + tag) : tag + text;
  const h = new Headers(res.headers);
  h.delete('content-length');
  h.delete('x-jsh-saved');
  return new Response(out, { status: 200, headers: h });
}

/* versioned files and data blocks: the saved copy, else the network (and keep only the newest version of each file) */
async function kept(e, r, u) {
  const cache = await caches.open(FILES);
  const hit = await cache.match(r);
  if (hit) return hit;
  const res = await fetch(r);
  if (res.ok && res.type === 'basic') {
    const copy = res.clone();
    e.waitUntil((async () => {
      const old = await cache.keys();
      await Promise.all(old.filter((k) => { const x = new URL(k.url); return x.pathname === u.pathname && k.url !== r.url; }).map((k) => cache.delete(k)));
      await cache.put(r, copy);
    })());
  }
  return res;
}

/* logos and icons: the saved copy at once, refreshed in the background */
async function quick(e, r) {
  const cache = await caches.open(FILES);
  const hit = await cache.match(r);
  const net = fetch(r).then((res) => { if (res.ok && res.type === 'basic') cache.put(r, res.clone()); return res; });
  if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
  return net;
}

/* everything else: the network, the saved copy only when offline */
async function netFirst(r) {
  const cache = await caches.open(FILES);
  try {
    const res = await fetch(r);
    if (res.ok && res.type === 'basic') cache.put(r, res.clone());
    return res;
  } catch (x) {
    const hit = await cache.match(r);
    if (hit) return hit;
    throw x;
  }
}
