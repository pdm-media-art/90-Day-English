// sw.js – minimaler Service Worker für die Diabetes Challenge App

const CACHE_VERSION = "v1.0.0";
const CACHE_NAME = `diabetes90-cache-${CACHE_VERSION}`;

// Dateien, die wir für Offline-Betrieb cachen wollen
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./sw.js",
  // Icons – passe Pfade/Namen an deine tatsächlichen Dateien an
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  // Externe Styles: Font Awesome
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
];

// Installation: Cache aufbauen
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// Aktivierung: Alte Caches löschen, wenn Version geändert wurde
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("diabetes90-cache-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch-Handler: Cache first, dann Netzwerk
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Für nicht-GET Requests (POST etc.) einfach normal zum Netzwerk
  if (request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // Wenn nicht im Cache: aus dem Netz holen und optional cachen
      return fetch(request)
        .then((networkResponse) => {
          // Nur OK-Antworten cachen
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === "opaque") {
            return networkResponse;
          }

          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });

          return networkResponse;
        })
        .catch(() => {
          // Optional: Fallback für offline, wenn nicht im Cache
          // z.B. eine Offline-Seite, die du hier zurückgeben könntest
          return caches.match("./index.html");
        });
    })
  );
});
