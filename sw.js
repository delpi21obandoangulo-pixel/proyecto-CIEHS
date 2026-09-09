/* ============================================================================
   CIEHS · Service Worker

   Objetivo: que el portal ABRA aunque no haya red. El laboratorio de Huanchaco
   tiene conexión intermitente —el propio código de datos ya lo asume— y hasta
   ahora, sin red, el navegador mostraba el dinosaurio de "sin conexión". Con
   esto, abre el portal cacheado y cada sección enseña su respaldo estático.

   ESTRATEGIA, elegida para no servir código viejo tras un despliegue:
   - App shell (documento, JS y CSS): RED PRIMERO, con la caché como respaldo.
     Así, con red, siempre se sirve la última versión; sin red, la última que se
     vio. Los archivos no llevan hash en el nombre (ciehs-app.js es estable), y
     cachearlos "caché primero" serviría código viejo tras cada deploy — por eso
     red primero.
   - Imágenes, iconos y fuentes propias: CACHÉ PRIMERO. Cambian poco y son lo
     más pesado; servirlas de caché hace el arranque instantáneo.
   - Supabase y PhET: NUNCA se tocan. Los datos tienen que ser frescos o fallar
     al respaldo estático; cachear la API daría pedidos y precios fantasma.
   ========================================================================== */
'use strict';

var VERSION = 'ciehs-v1';
var SHELL = VERSION + '-shell';
var MEDIA = VERSION + '-media';

// Lo mínimo para que el portal arranque sin red.
var PRECARGA = [
  '/',
  '/index.html',
  '/assets/css/ciehs.css',
  '/assets/js/supabase.js',
  '/assets/js/ciehs-data.js',
  '/assets/js/ciehs-preguntas.js',
  '/assets/js/ciehs-arena-preguntas.js',
  '/assets/js/ciehs-arena.js',
  '/assets/js/qrcode.js',
  '/assets/js/ciehs-app.js',
  '/assets/img/logo-ciehs.svg',
  '/assets/img/escudo-ie80033.png',
  '/manifest.json'
];

self.addEventListener('install', function (e) {
  // skipWaiting: el SW nuevo toma el control sin esperar a que se cierren las
  // pestañas. Con app-shell red-primero no hay riesgo de mezcla de versiones.
  e.waitUntil(
    caches.open(SHELL).then(function (c) {
      // addAll falla entero si un recurso falla; se toleran fallos sueltos para
      // que la instalación no se caiga por un 404 de un asset renombrado.
      return Promise.allSettled(PRECARGA.map(function (u) { return c.add(u); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (claves) {
      return Promise.all(claves.map(function (k) {
        // Se borran las cachés de versiones anteriores.
        if (k !== SHELL && k !== MEDIA) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

function esMedia(url) {
  return /\.(png|jpg|jpeg|webp|svg|gif|woff2?|ttf|otf|mp3|ogg)$/i.test(url.pathname);
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;                 // altas/escrituras: nunca

  var url = new URL(req.url);

  // Terceros (Supabase, PhET, Google Fonts): que el navegador los gestione.
  // No se cachea la API: un pedido o un precio cacheado sería un fantasma.
  if (url.origin !== self.location.origin) return;

  // Media propia: caché primero, y se rellena la caché al vuelo.
  if (esMedia(url)) {
    e.respondWith(
      caches.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) {
          if (res.ok) { var copia = res.clone(); caches.open(MEDIA).then(function (c) { c.put(req, copia); }); }
          return res;
        });
      })
    );
    return;
  }

  // App shell (documento, JS, CSS): red primero, caché de respaldo.
  e.respondWith(
    fetch(req).then(function (res) {
      if (res.ok) { var copia = res.clone(); caches.open(SHELL).then(function (c) { c.put(req, copia); }); }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        // Para una navegación sin caché exacta, se devuelve el index cacheado:
        // la SPA resuelve la ruta por el fragmento una vez cargada.
        return hit || (req.mode === 'navigate' ? caches.match('/index.html') : undefined);
      });
    })
  );
});
