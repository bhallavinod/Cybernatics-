// CymaticaMandala Service Worker
// Cache-first strategy — app works fully offline after first load

const CACHE_NAME = 'cymatica-v1';
const ASSETS = [
  './CymaticaMandala.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Raleway:wght@300;400;500&display=swap'
];

// Install: pre-cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first, falling back to network + cache update
self.addEventListener('fetch', event => {
  // Skip non-GET and chrome-extension requests
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension://')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Only cache valid responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
        return response;
      }).catch(() => {
        // Offline fallback for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('./CymaticaMandala.html');
        }
      });
    })
  );
});
