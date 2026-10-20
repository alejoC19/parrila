// Cache mínimo para que la carta abra aunque la señal sea mala.
// - Archivos con hash (/_astro/*): cache primero.
// - Páginas: red primero (3 s) y, si no llega, la última copia guardada.
const VERSION = 'v1';
const CACHE = `parrilla-co-${VERSION}`;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  if (url.pathname.startsWith('/_astro/') || /\.(woff2?|avif|webp|jpg|svg)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
    return;
  }

  if (req.mode === 'navigate') {
    e.respondWith(
      new Promise((resolve) => {
        const timer = setTimeout(() => caches.match(req).then((hit) => hit && resolve(hit)), 3000);
        fetch(req)
          .then((res) => {
            clearTimeout(timer);
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            resolve(res);
          })
          .catch(() => caches.match(req).then((hit) => resolve(hit || Response.error())));
      }),
    );
  }
});
