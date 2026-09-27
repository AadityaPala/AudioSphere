self.addEventListener('install', (e) => {
    console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e) => {
    // A simple pass-through. We aren't building offline mode right now, 
    // but this satisfies the PWA requirement.
    e.respondWith(fetch(e.request));
});