const CACHE_NAME = 'dzongkha-dict-v1.12';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './admin.js',
  './manifest.json',
  './english_to_dzongkha.json',
  './collected_terminology.json',
  './terminology_2026.json',
  './countries_capitals.json',
  './public_service.json',
  './place_names.json',
  './dzongkha_to_english.json',
  './dzongkha_to_dzongkha.json',
  './colloquial_terminology.json',
  './final_tense.json',
  './assets/app-logo.png',
  './assets/jamyang-loday.png',
  './assets/icon-192.png'
];

// Install Service Worker and cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        ASSETS_TO_CACHE.map((asset) =>
          cache.add(asset).catch((error) => {
            console.warn('SW install: skipped cache asset', asset, error);
          })
        )
      );
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

// Fetch strategy: Network First for JSON data, Cache First for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isDataFile = url.pathname.endsWith('.json');

  event.respondWith(
    isDataFile 
      ? fetch(event.request)
          .then((response) => {
            if (!response.ok) return response; // Don't cache errors
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            return response;
          })
          .catch(() => caches.match(event.request, { ignoreSearch: true }))
      : caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
