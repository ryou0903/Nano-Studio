// Nano Studio Service Worker v5 (Offline Capable)
const CACHE_NAME = 'nano-studio-v5';
const SCOPE = '/Nano-Studio/';
const PRECACHE_URLS = [
  SCOPE + 'index.html',
  SCOPE + 'manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Precaching core assets');
      return cache.addAll(PRECACHE_URLS);
    })
  );
});

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

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Redirect stray 'assets/index.html' requests to root
  if (url.pathname.includes('/assets/index.html')) {
    event.respondWith(Response.redirect(SCOPE, 301));
    return;
  }

  // 2. Handle Navigation Requests (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If network fails (offline), return the cached index.html
          // This satisfies Chrome's PWA installation criteria for WebAPK
          return caches.match(SCOPE + 'index.html');
        })
    );
    return;
  }

  // 3. Handle Static Assets & Other Requests
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if found, otherwise fetch from network
      return cachedResponse || fetch(event.request).then((response) => {
        // Optionally cache new requests dynamically here if needed
        return response;
      });
    })
  );
});