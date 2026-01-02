// Nano Studio Service Worker v4 (Rescue Mode)
const CACHE_NAME = 'nano-studio-v4';
const SCOPE = '/Nano-Studio/';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // --- CRITICAL FIX FOR WHITE SCREEN ---
  // If the device tries to load the non-existent 'assets/index.html',
  // we intercept it and redirect to the root.
  if (url.pathname.includes('/assets/index.html')) {
    console.log('Redirecting stray request from assets/index.html to root');
    event.respondWith(Response.redirect(SCOPE, 301));
    return;
  }

  // For main navigation requests (opening the app), prioritize network
  // but fall back to the root index.html if it fails (SPA support).
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return fetch(SCOPE + 'index.html');
      })
    );
    return;
  }

  // Default network-first strategy
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});