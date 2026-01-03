// Nano Studio Service Worker v15 (Protocol Guard)
const CACHE_NAME = 'nano-studio-v15';

// Use relative paths. The browser resolves these relative to sw.js location.
const urlsToCache = [
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Precaching core assets');
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
  // 1. Navigation Requests (The "App Shell")
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Network failed (Offline). Return the cached index.html.
        return caches.match('./index.html').then(response => {
            if (response) return response;
            return new Response("Offline. Please reload.", { headers: { "Content-Type": "text/plain" } });
        });
      })
    );
    return;
  }

  // 2. Static Assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});