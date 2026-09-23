/* init.Habits service worker — offline shell cache.
 * Relative paths so it works under a base path (GitHub Pages /habit-tracker/).
 * Bump CACHE_VERSION saat ganti aset.
 */
const CACHE_VERSION = 'inithabits-v2'
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) =>
        Promise.all(
          SHELL.map((p) =>
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

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE_VERSION).then((c) => c.put('./index.html', copy))
          return res
        })
        .catch(() =>
          caches.match('./index.html').then((r) => r || caches.match('./').then((x) => x) || Response.error()),
        ),
    )
    return
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone()
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy))
          }
          return res
        })
        .catch(() => cached || Response.error())
      return cached || network
    }),
  )
})
