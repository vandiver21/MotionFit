const CACHE_NAME = "motionfit-v1.0.0";
const APP_SHELL = [
  "./",
  "index.html",
  "css/styles.css",
  "js/app.js",
  "data/exercises.json",
  "data/exercise-image-map.json",
  "manifest.json",
  "icons/icon-192.svg",
  "icons/icon-512.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME)
    .then(cache => cache.addAll(APP_SHELL))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith("motionfit-v") && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if(event.request.method !== "GET" || !event.request.url.startsWith(self.registration.scope)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    if(cached) return cached;

    try{
      const response = await fetch(event.request);
      if(response.ok){
        // Keep the worker alive until the write finishes; quota errors must not hide a valid response.
        await cache.put(event.request, response.clone()).catch(() => {});
      }
      return response;
    }catch(error){
      if(event.request.mode === "navigate"){
        const fallback = await cache.match("index.html");
        if(fallback) return fallback;
      }
      return Response.error();
    }
  })());
});
