// Negroni Club — service worker.
// Goal: the app shell loads from cache, so the page works offline. Local
// CRDT writes still hit localStorage (no SW involvement). When the user
// comes back online, schedulePush() in the page drains the queue.
//
// Strategies:
//   /, /index.html, /vendor/*       → cache-first (app shell)
//   /manifest.json                  → cache-first
//   fonts.googleapis.com            → stale-while-revalidate (CSS small, refresh in background)
//   fonts.gstatic.com (woff2)       → cache-first (font binaries are immutable per URL)
//   CARTO map tiles                 → cache-first
//   /club/feed                      → network-first, cache fallback
//   everything else (auth, pod, …)  → network-only

const VERSION     = "v57b-dark-mode";
const SHELL_CACHE = `nc-shell-${VERSION}`;
const TILE_CACHE  = `nc-tiles-${VERSION}`;
const FEED_CACHE  = `nc-feed-${VERSION}`;
const FONTS_CACHE = `nc-fonts-${VERSION}`;

const SHELL = [
  "/",
  "/manifest.json",
  "/vendor/index.umd.min.js",
  "/vendor/leaflet/leaflet.js",
  "/vendor/leaflet/leaflet.css",
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    // Per-item cache.add with allSettled — a single missing URL won't roll back the
    // entire install. Anything that fails will be re-tried on next page-mediated fetch.
    const results = await Promise.allSettled(SHELL.map(u => cache.add(u)));
    const failed = results
      .map((r, i) => r.status === "rejected" ? SHELL[i] : null)
      .filter(Boolean);
    if (failed.length) console.warn("[sw] shell items failed:", failed);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const allowed = new Set([SHELL_CACHE, TILE_CACHE, FEED_CACHE, FONTS_CACHE]);
    const names = await caches.keys();
    await Promise.all(names.filter(n => !allowed.has(n)).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

const isShell = (url) =>
  url.origin === self.location.origin &&
  (url.pathname === "/" || url.pathname === "/index.html" ||
   url.pathname === "/manifest.json" ||
   url.pathname.startsWith("/vendor/"));

const isFontsCss     = (url) => url.hostname === "fonts.googleapis.com";
const isFontsBinary  = (url) => url.hostname === "fonts.gstatic.com";
const isTile         = (url) => url.hostname.endsWith(".basemaps.cartocdn.com");
const isFeed         = (url) =>
  url.origin === self.location.origin && url.pathname === "/club/feed";

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (isShell(url))        return event.respondWith(cacheFirst(req, SHELL_CACHE));
  if (isFontsBinary(url))  return event.respondWith(cacheFirst(req, FONTS_CACHE));
  if (isFontsCss(url))     return event.respondWith(staleWhileRevalidate(req, FONTS_CACHE));
  if (isTile(url))         return event.respondWith(cacheFirst(req, TILE_CACHE));
  if (isFeed(url))         return event.respondWith(networkFirst(req, FEED_CACHE));
  // everything else: default browser behaviour (network-only)
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request, { ignoreVary: true });
  if (hit) return hit;
  try {
    const resp = await fetch(request);
    if (resp.ok || resp.type === "opaque") cache.put(request, resp.clone());
    return resp;
  } catch (err) {
    if (request.mode === "navigate") {
      const fallback = await cache.match("/", { ignoreVary: true });
      if (fallback) return fallback;
    }
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreVary: true });
  const network = fetch(request).then(resp => {
    if (resp.ok || resp.type === "opaque") cache.put(request, resp.clone());
    return resp;
  }).catch(() => null);
  return cached || (await network) || new Response("", { status: 504 });
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const resp = await fetch(request);
    if (resp.ok) cache.put(request, resp.clone());
    return resp;
  } catch {
    const hit = await cache.match(request, { ignoreVary: true });
    if (hit) return hit;
    return new Response(JSON.stringify({ items: [], offline: true }), {
      status: 200, headers: { "content-type": "application/json" },
    });
  }
}
