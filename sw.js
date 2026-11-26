// Keep this release number in sync with app.js, version.json and index.html asset URLs.
const RELEASE = '1.10.0';
const base = new URL(self.registration.scope);
const prefix = `finanzpilot-shell:${base.href}:`;
const cacheName = prefix + RELEASE;
const asset = path => new URL(path, base).href;
const shell = asset('index.html');
const files = [shell, asset(`style.css?v=${RELEASE}`), asset(`app.js?v=${RELEASE}`), asset('manifest.webmanifest'), asset('icons/icon-192.png'), asset('icons/icon-512.png'), asset('icons/maskable-512.png')];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(files.map(url => new Request(url, {cache:'reload'})))));
  // First installation activates automatically; later releases wait for user approval or all tabs to close.
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Keep other app caches untouched; keep the prior release available to older open tabs.
    const keys = (await caches.keys()).filter(k => k.startsWith(prefix) && k !== cacheName);
    await Promise.all(keys.slice(0, Math.max(0, keys.length - 1)).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'ACTIVATE_RELEASE') event.waitUntil(self.skipWaiting());
});
self.addEventListener('fetch', event => {
  const req = event.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return;
  // Never serve stale release metadata or cache update requests.
  if (url.pathname === new URL('version.json', base).pathname || url.pathname === new URL('sw.js', base).pathname) return;
  if (req.mode === 'navigate' && (url.pathname === base.pathname || url.pathname === new URL('index.html', base).pathname)) {
    event.respondWith(caches.open(cacheName).then(cache => cache.match(shell)).then(response => response || fetch(req)));
    return;
  }
  if (files.includes(url.href)) {
    event.respondWith(caches.open(cacheName).then(cache => cache.match(req)).then(response => response || fetch(req)));
  }
});
