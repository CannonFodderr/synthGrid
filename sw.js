let cacheName = 'synthCache';
let urlsToCache = [
    './assets/style/main.css',
    './assets/scripts/script.js'
];
self.addEventListener('install', (e)=>{
    e.waitUntil(caches.open(cacheName).then((cache)=>{
        return cache.addAll(urlsToCache);
    }));
});

self.addEventListener('fetch', (e)=>{
    e.respondWith(caches.match(e.request).then((response)=>{
        if(response){
            return response;
        }
        return fetch(e.request);
    }));
});