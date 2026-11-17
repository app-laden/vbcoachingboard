// Volleyball Coach – Service Worker für GitHub Pages
// Bei jeder neuen Version VERSION hier UND in index.html erhöhen.
var VERSION = '2.2';
var CACHE = 'vbcoach-' + VERSION;
var FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  // Jede Datei frisch vom Server holen (nicht aus dem Browser-Zwischenspeicher)
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(FILES.map(function (f) {
      return fetch(new Request(f, { cache: 'reload' })).then(function (res) {
        if (!res.ok) throw new Error('Laden fehlgeschlagen: ' + f);
        return c.put(f, res);
      });
    }));
  }));
  // kein skipWaiting: die neue Version wartet, bis die grüne Leiste angetippt wird
});

self.addEventListener('message', function (e) {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('vbcoach-') === 0 && k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// Immer zuerst aus dem Speicher (schneller Start, offline), sonst aus dem Netz
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(function (cache) {
    var key = req.mode === 'navigate' ? './index.html' : req;
    return cache.match(key, { ignoreSearch: true }).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        if (res && res.ok && req.mode !== 'navigate') cache.put(req, res.clone());
        return res;
      });
    });
  }));
});
