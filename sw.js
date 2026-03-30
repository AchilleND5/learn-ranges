const CACHE_NAME = 'range-trainer-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Network-first for everything (images can be large, don't cache aggressively)
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
