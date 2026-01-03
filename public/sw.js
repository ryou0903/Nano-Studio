// Nano Studio Service Worker v16 (Directory-based Routing)
const CACHE_NAME = 'nano-studio-v16';

// Cache the root directory instead of the filename to align with manifest start_url
const urlsToCache = [
  './',
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
  // Navigation Requests: Serve the cached root for any sub-path navigation if offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Return cached root or index
        return caches.match('./').then(response => {
            return response || caches.match('./index.html');
        }).then(response => {
            if (response) return response;
            return new Response("Offline. Please reload.", { headers: { "Content-Type": "text/plain" } });
        });
      })
    );
    return;
  }

  // Static Assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});