const CACHE_NAME = 'rocketmoto-v2';
const STATIC_CACHE_NAME = 'rocketmoto-static-v2';

// Static assets that can be cached longer
const staticUrlsToCache = [
  '/icon.png',
  '/manifest.json'
];

// Install service worker and cache static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        return cache.addAll(staticUrlsToCache);
      })
  );
});

// Activate service worker and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (![CACHE_NAME, STATIC_CACHE_NAME].includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch resources using network-first strategy for HTML and dynamic content
// and cache-first strategy for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Use cache-first for static assets
  if (staticUrlsToCache.some(staticUrl => event.request.url.endsWith(staticUrl))) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => response || fetch(event.request))
    );
    return;
  }

  // Only handle GET requests, ignore others
  if (event.request.method !== 'GET') {
    return;
  }

  // Network-first strategy for GET requests
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const responseToCache = response.clone();

        // Only cache complete successful GET responses (status 200)
        if (response.status === 200) {
          caches.open(CACHE_NAME)
            .then((cache) => {
              // Add no-cache header to dynamic content
              const headers = new Headers(responseToCache.headers);
              headers.append('Cache-Control', 'no-cache');
              
              const responseWithHeaders = new Response(
                responseToCache.body,
                {
                  status: responseToCache.status,
                  statusText: responseToCache.statusText,
                  headers: headers
                }
              );
              
              cache.put(event.request, responseWithHeaders);
            })
            .catch(error => {
              console.error('Cache error:', error);
            });
        }

        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request);
      })
  );
});