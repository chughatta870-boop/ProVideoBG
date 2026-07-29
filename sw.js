const CACHE_NAME = "provideobg-v3";
const STATIC_CACHE = [
  "./",
  "./index.html",
  "./style.css", 
  "./script.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// CDN files jo app chalane ke liye zaroori hain
const CDN_CACHE = [
  "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js",
  "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.wasm",
  "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation_solution_simd_wasm_bin.js",
  "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core/dist/tf-core.min.js",
  "https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/ffmpeg.min.js",
  "https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js",
  "https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.wasm",
  "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap"
];

// 1. INSTALL - Sab files cache me save karo
self.addEventListener('install', (e) => {
  console.log('[SW] Installing ProVideoBG...');
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([...STATIC_CACHE, ...CDN_CACHE]);
    })
  );
  self.skipWaiting(); // Turant activate
});

// 2. ACTIVATE - Purana cache saaf karo
self.addEventListener('activate', (e) => {
  console.log('[SW] Activating...');
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 3. FETCH - Pehle cache, na mile to network
self.addEventListener('fetch', (e) => {
  // Sirf GET requests cache karo
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // Offline: cache se do
      }

      // Online: network se lao aur cache me save karo
      return fetch(e.request).then((response) => {
        // Sirf valid response cache karo
        if(!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });

        return response;
      });
    }).catch(() => {
      // Agar offline hai aur file nahi mili
      if(e.request.destination === 'document'){
        return caches.match('./index.html');
      }
    })
  );
});

// 4. MESSAGE - Update ke liye
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
