// ── Verdad o Reto · Service Worker ──
// Incrementa VOR_VERSION al publicar cambios que quieras que los usuarios reciban.
const VOR_VERSION = 'vor-v2';

const STATIC_CACHE = VOR_VERSION + '-static';
const FONT_CACHE   = VOR_VERSION + '-fonts';

// Archivos que se cachean al instalar la PWA
const PRECACHE_URLS = [
  '/tor',
  '/icons/vor-192.png',
  '/icons/vor-512.png',
  '/manifest-vor.json',
];

// ── INSTALL: precachear archivos estáticos ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: eliminar caches de versiones anteriores ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('vor-') && k !== STATIC_CACHE && k !== FONT_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── PUSH: recibir notificaciones del servidor ──
self.addEventListener('push', event => {
  let data = { title: 'Terraza Luna', body: '¡Tienes un mensaje!', url: '/tor', icon: '/icons/vor-192.png' };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:  data.body,
      icon:  data.icon,
      badge: '/icons/vor-192.png',
      data:  { url: data.url },
      vibrate: [200, 100, 200],
    })
  );
});

// ── NOTIFICATION CLICK: abrir la app al tocar la notificación ──
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification.data?.url || '/tor';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(target) && 'focus' in client) return client.focus();
      }
      return clients.openWindow(target);
    })
  );
});

// ── FETCH: estrategia por tipo de request ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Supabase (datos dinámicos) → siempre red, sin cache
  if (url.hostname.includes('supabase.co')) {
    return; // dejar pasar sin interceptar
  }

  // Google Fonts → cache-first (se cachean la primera vez)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // CDN externos (html5-qrcode, etc.) → cache-first
  if (url.hostname === 'cdnjs.cloudflare.com') {
    event.respondWith(
      caches.open(STATIC_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // Archivos propios → stale-while-revalidate
  // Sirve desde cache de inmediato y actualiza en background
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          const networkFetch = fetch(event.request).then(response => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          }).catch(() => cached); // si no hay red, usar cache

          return cached || networkFetch;
        })
      )
    );
  }
});
