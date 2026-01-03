// Nano Studio Service Worker v7 (Universal Path)
// Dynamically determine the scope to support both GitHub Pages (/Nano-Studio/) and Dev/Preview (/)
const SCOPE = self.registration.scope;
const CACHE_NAME = 'nano-studio-v7';

// Construct the absolute URL for index.html based on the dynamic scope
const INDEX_HTML_URL = new URL('index.html', SCOPE).href;

const PRECACHE_URLS = [
  INDEX_HTML_URL,
  new URL('manifest.json', SCOPE).href
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Precaching core assets for scope:', SCOPE);
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

  // 1. Rescue: Redirect stray 'assets/index.html' requests
  // We use endsWith to catch it regardless of the base path
  if (url.pathname.endsWith('/assets/index.html')) {
    event.respondWith(Response.redirect(INDEX_HTML_URL, 301));
    return;
  }

  // 2. Navigation Requests (The "App Shell")
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Network failed (Offline). Return the cached index.html.
        return caches.match(INDEX_HTML_URL).then(response => {
            if (response) return response;
            return new Response("Offline. Please reload.", { headers: { "Content-Type": "text/plain" } });
        });
      })
    );
    return;
  }

  // 3. Static Assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});