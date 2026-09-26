/* Rootine service worker — offline shell cache.
 * Relative paths so it works under a base path (GitHub Pages /habit-tracker/).
 * The precache list is injected at build time by the vite plugin
 * `rootine-sw-precache` (see vite.config.ts) — hashed assets must be in the
 * cache too, otherwise an offline reload gets HTML but no JS.
 */
const CACHE_VERSION = 'rootine-v4'
const FALLBACK = './index.html'
const PRECACHE = ['./', FALLBACK, './manifest.webmanifest', ...(self.__ROOTINE_PRECACHE || [])]
// servers send `Vary: Origin` / `Vary: Accept-Encoding`, and the request we match
// with (a navigation or a cors fetch) carries different header values than the one
// cache.add() used — without ignoreVary every lookup misses and the app looks offline-broken
const MATCH_OPTS = { ignoreVary: true }

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) =>
        Promise.all(
          [...new Set(PRECACHE)].map((p) =>
            cache.add(p).catch(() => {
              /* ignore individual miss */
            }),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  // only handle requests within SW scope
  if (!url.pathname.startsWith(self.registration.scope)) return

  // documents: network first so deploys land immediately, cache as the offline net
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE_VERSION).then((c) => c.put(FALLBACK, copy))
          return res
        })
        .catch(() =>
          caches
            .match(FALLBACK, MATCH_OPTS)
            .then((r) => r || caches.match('./', MATCH_OPTS).then((x) => x) || Response.error()),
        ),
    )
    return
  }

  // hashed assets: cache first (they are immutable), refresh in the background
  event.respondWith(
    caches.match(req, MATCH_OPTS).then((cached) => {
      if (cached) {
        // NOTE: no event.waitUntil here — it must be called synchronously during
        // dispatch, and this runs in a microtask. A floating promise is fine.
        fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone()
              return caches.open(CACHE_VERSION).then((c) => c.put(req, copy))
            }
          })
          .catch(() => {})
        return cached
      }
      return fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone()
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy))
          }
          return res
        })
        .catch(() => Response.error())
    }),
  )
})
