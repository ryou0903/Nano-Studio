// Nano Studio Service Worker v6 (Strict Offline)
const CACHE_NAME = 'nano-studio-v6';
const SCOPE = '/Nano-Studio/';
const INDEX_HTML_URL = SCOPE + 'index.html';

const PRECACHE_URLS = [
  INDEX_HTML_URL,
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
              return caches.delete(cacheName);
            }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Rescue: Redirect stray 'assets/index.html' requests to root
  if (url.pathname.includes('/assets/index.html')) {
    event.respondWith(Response.redirect(SCOPE, 301));
    return;
  }

  // 2. Navigation Requests (The "App Shell")
  // If it's a page load, we MUST return index.html to satisfy PWA criteria,
  // even if offline or if URL has query params like ?source=pwa
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Network failed (Offline). Return the cached index.html explicitly.
        // We ignore the actual URL params and serve the shell.
        return caches.match(INDEX_HTML_URL).then(response => {
            if (response) return response;
            // Fallback for extreme edge cases
            return new Response("Offline. Please reload.", { headers: { "Content-Type": "text/plain" } });
        });
      })
    );
    return;
  }

  // 3. Static Assets (Images, Scripts)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if found, otherwise fetch from network
      return cachedResponse || fetch(event.request);
    })
  );
});