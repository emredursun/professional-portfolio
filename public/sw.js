// Service Worker for Emre Dursun Portfolio
// Version: 1.0.0

const CACHE_NAME = 'ed-portfolio-v1';
const OFFLINE_URL = '/';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/favicon-32x32.png',
  '/favicon-96x96.png',
  '/images/profile.png',
  '/images/social-share.png'
];

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching critical assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - cache-first for assets, network-first for pages
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests (analytics, fonts CDN, etc.)
  if (!url.origin.includes(self.location.origin)) return;

  // Cache-first for static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Network-first for HTML pages
  event.respondWith(networkFirst(request));
});

// Check if request is for a static asset
function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|webp|gif|svg|woff|woff2|ttf|eot|ico)$/i.test(pathname);
}

// Cache-first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first fetch failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network-first strategy with cache fallback
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to cached homepage for navigation requests
    if (request.mode === 'navigate') {
      const cachedHome = await caches.match(OFFLINE_URL);
      if (cachedHome) {
        return cachedHome;
      }
    }
    
    return new Response('Offline', { status: 503 });
  }
}
