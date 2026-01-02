// Nano Studio Service Worker v2
const CACHE_NAME = 'nano-studio-v2';

// Install event: Skip waiting to activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event: Clear old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Network first, fall back to nothing (for now) to avoid stale cache issues
// This ensures that if index.html or js files change, we get them fresh.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
        // Optional: return offline page if needed
        // return caches.match(event.request);
    })
  );
});