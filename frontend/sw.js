/**
 * UnionTech MVP - Service Worker
 * Manejo de cache y funcionalidades offline
 */

const CACHE_NAME = 'uniontech-mvp-v1.0.0';
const urlsToCache = [
    '/',
    '/index-mvp.html',
    '/css/professional.css',
    '/js/app-mvp.js',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Service Worker: Cache abierto');
                return cache.addAll(urlsToCache.filter(url => !url.startsWith('http')));
            })
    );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker: Activado');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Service Worker: Eliminando cache antiguo', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
    // Solo cachear requests GET y HTTP/HTTPS
    if (event.request.method !== 'GET' || 
        !event.request.url.startsWith('http') ||
        event.request.url.startsWith('chrome-extension:') ||
        event.request.url.startsWith('moz-extension:')) {
        return;
    }

    // No cachear API calls
    if (event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Devolver respuesta del cache si existe
                if (response) {
                    return response;
                }

                // Fetch de la red
                return fetch(event.request).then((response) => {
                    // Verificar que la respuesta sea válida
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clonar la respuesta
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
    );
});

// Manejo de errores
self.addEventListener('error', (event) => {
    console.error('❌ Service Worker Error:', event.error);
});

// Notificaciones push (para futuras implementaciones)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Nueva notificación de UnionTech',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'uniontech-notification'
    };

    event.waitUntil(
        self.registration.showNotification('UnionTech MVP', options)
    );
});

// Click en notificaciones
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow('/')
    );
});

console.log('🚀 Service Worker cargado correctamente');
