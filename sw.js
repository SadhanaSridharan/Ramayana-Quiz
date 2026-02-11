// sw.js (replace entire file)
const CACHE = "ramayana-quiz-v51";
const BASE = "/Ramayana-Quiz";

const PRECACHE = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/manifest.webmanifest`,
  `${BASE}/icon-192.png`,
  `${BASE}/icon-512.png`,
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    // delete old caches
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE ? caches.delete(k) : Promise.resolve())));
    // take control
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // Only handle our own origin
  if (url.origin !== location.origin) return;

  // 1) Page navigations: NETWORK FIRST (so updates work)
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(`${BASE}/index.html`, fresh.clone());
        return fresh;
      } catch {
        return (await caches.match(req)) ||
               (await caches.match(`${BASE}/index.html`)) ||
               Response.error();
      }
    })());
    return;
  }

  // 2) Static files: CACHE FIRST
  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;

    try {
      const fresh = await fetch(req);
      const cache = await caches.open(CACHE);
      cache.put(req, fresh.clone());
      return fresh;
    } catch {
      // No HTML fallback for images/icons — just fail cleanly
      return Response.error();
    }
  })());
});
