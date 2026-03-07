const CACHE_NAME = 'tdb-chauffeur-v1';
const OFFLINE_URL = '/chauffeur/login';

// Ressources à mettre en cache
const urlsToCache = [
  '/',
  '/chauffeur/login',
  '/chauffeur/portal',
  '/static/js/bundle.js',
  '/manifest.json',
];

// Installation du service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Cache ouvert');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Stratégie de fetch : Network first, puis cache
self.addEventListener('fetch', (event) => {
  // Ne pas intercepter les appels API
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone la réponse pour la mettre en cache
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si offline, retourne depuis le cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // Si pas en cache et navigation, retourne la page offline
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
        });
      })
  );
});

// Gestion des notifications push
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nouvelle notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'open', title: 'Ouvrir' },
      { action: 'close', title: 'Fermer' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Terre de Beauce', options)
  );
});

// Clic sur notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/chauffeur/portal')
    );
  }
});

// Sync en arrière-plan pour les pointages hors-ligne
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pointages') {
    event.waitUntil(syncPointages());
  }
});

async function syncPointages() {
  try {
    // Récupérer les pointages en attente depuis IndexedDB
    const db = await openDB();
    const tx = db.transaction('pending-pointages', 'readonly');
    const store = tx.objectStore('pending-pointages');
    const pendingPointages = await store.getAll();

    for (const pointage of pendingPointages) {
      try {
        const response = await fetch('/api/pointages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pointage.data)
        });

        if (response.ok) {
          // Supprimer de la file d'attente
          const deleteTx = db.transaction('pending-pointages', 'readwrite');
          const deleteStore = deleteTx.objectStore('pending-pointages');
          await deleteStore.delete(pointage.id);
        }
      } catch (error) {
        console.error('Erreur sync pointage:', error);
      }
    }
  } catch (error) {
    console.error('Erreur sync:', error);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TerreDeBeauceDB', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}
