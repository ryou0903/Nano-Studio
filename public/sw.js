// Nano Studio Service Worker v24 (Query Ignore & PNG)
const CACHE_NAME = 'nano-studio-v24';

const urlsToCache = [
  './',
  './index.html',
  './404.html',
  './manifest.json?v=24.0.0'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Navigation requests: always try network first, fall back to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // CRITICAL FIX: ignoreSearch: true handles ?source=pwa or other query params
        return caches.match('./index.html', { ignoreSearch: true }).then(response => {
            return response || caches.match('./', { ignoreSearch: true });
        });
      })
    );
    return;
  }

  // Asset requests
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});