const CACHE_NAME = 'dzongkha-dict-v1.1'; // Incrementing version to force update
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './admin.js',
  './manifest.json',
  './english_to_dzongkha.json',
  './dzongkha_to_english.json',
  './dzongkha_to_dzongkha.json',
  './colloquial_terminology.json',
  './assets/app-logo.png',
  './assets/jamyang-loday.png',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

// Install Service Worker and cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch strategy: Cache falling back to Network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});