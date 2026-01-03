// Nano Studio Service Worker v30 (Cache Busting)
const CACHE_NAME = 'nano-studio-v30';

// Explicitly list the PNGs to force them into cache
const urlsToCache = [
  './',
  './index.html',
  './404.html',
  './icon-192.png',
  './icon-512.png',
  './manifest.json?v=30.0.1'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activate immediately
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
            // Delete ALL old caches that don't match v30
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
        })
      );
    }).then(() => self.clients.claim()) // Take control immediately
  );
});

self.addEventListener('fetch', (event) => {
  // Navigation requests: always serve index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('./index.html', { ignoreSearch: true }).then(response => {
            return response || caches.match('./', { ignoreSearch: true });
        });
      })
    );
    return;
  }

  // Static assets
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      // Return cached response or fetch from network
      return cachedResponse || fetch(event.request);
    })
  );
});