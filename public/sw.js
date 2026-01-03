// Nano Studio Service Worker v29 (Dual PNG Icons)
const CACHE_NAME = 'nano-studio-v29';

const urlsToCache = [
  './',
  './index.html',
  './404.html',
  './icon-192.png',
  './icon-512.png',
  './manifest.json?v=29.0.0'
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
  const url = new URL(event.request.url);
  
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