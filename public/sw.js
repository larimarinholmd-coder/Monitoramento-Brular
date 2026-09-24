// Radar Pessoal service worker - Web Push + basic offline
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let payload = { title: 'Radar Pessoal', body: 'Novidade no seu radar', url: '/' }
  try { if (event.data) payload = { ...payload, ...event.data.json() } } catch {}
  const options = {
    body: payload.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.tag || 'radar',
    data: { url: payload.url || '/' },
  }
  event.waitUntil(self.registration.showNotification(payload.title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(clients.matchAll({ type: 'window' }).then(list => {
    for (const c of list) { if (c.url.includes(url) && 'focus' in c) return c.focus() }
    return clients.openWindow(url)
  }))
})
