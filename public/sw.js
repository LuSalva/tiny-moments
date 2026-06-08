const CACHE = 'abrazo-familiar-v1'

// ── Install: cache the app shell ────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(['/', '/index.html'])
    )
  )
  // Activate immediately without waiting for old tabs to close
  self.skipWaiting()
})

// ── Activate: remove stale caches from previous versions ────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Fetch: network-first, cache as fallback ──────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event

  // Only handle GET requests
  if (request.method !== 'GET') return

  // Never intercept Supabase API calls — always hit the network
  if (request.url.includes('supabase.co')) return

  // Never intercept chrome-extension or non-http requests
  if (!request.url.startsWith('http')) return

  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache a fresh copy of successful responses
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE).then(cache => cache.put(request, copy))
        }
        return response
      })
      .catch(() =>
        // Network failed — serve from cache if available
        caches.match(request).then(cached =>
          cached || caches.match('/index.html')
        )
      )
  )
})
