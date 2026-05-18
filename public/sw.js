// BuildCRM Service Worker - Powiadomienia Push

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Odbieranie powiadomień push
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'BuildCRM';
  const options = {
    body: data.body || 'Masz nowe przypomnienie',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'buildcrm-notification',
    requireInteraction: false,
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Kliknięcie w powiadomienie - otwiera aplikację
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data?.url || '/');
      }
    })
  );
});
