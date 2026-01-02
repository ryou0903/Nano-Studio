// Nano Studio Service Worker
const CACHE_NAME = 'nano-studio-v1';

// Install event: Skip waiting to activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event: Claim clients immediately to control the page
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Fetch event: Basic passthrough. 
// For a robust offline PWA, we would cache assets here.
// For now, we ensure requests are handled to prevent PWA crash on startup.
self.addEventListener('fetch', (event) => {
  // We can add caching logic here in the future.
  // Currently allowing network-first to ensure API calls work.
  event.respondWith(fetch(event.request));
});