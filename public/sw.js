// AlgoPronos AI — Service Worker for Web Push Notifications

self.addEventListener('push', function(event) {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'AlgoPronos AI', body: event.data.text() };
  }

  const title = data.title || 'AlgoPronos AI';
  const options = {
    body: data.body || 'Nouveau résultat disponible',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: data.tag || 'algopronos-result',
    data: { url: data.url || '/dashboard/history' },
    actions: [
      { action: 'view', title: 'Voir le résultat' },
    ],
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const url = event.notification.data?.url || '/dashboard/history';
  const action = event.action;

  if (action === 'view' || !action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});
