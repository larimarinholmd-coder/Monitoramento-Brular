import webpush from 'web-push'
import { getDb } from './mongo'

let ready = false
function init() {
  if (ready) return
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:contato@radar.app',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY,
    )
    ready = true
  }
}

export async function sendPushToUser(userId, payload) {
  init()
  if (!ready) return { sent: 0, reason: 'no_vapid' }
  const db = await getDb()
  const subs = await db.collection('push_subscriptions').find({ userId }).toArray()
  let sent = 0
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify(payload))
      sent++
    } catch (e) {
      if (e.statusCode === 410 || e.statusCode === 404) {
        await db.collection('push_subscriptions').deleteOne({ endpoint: s.endpoint })
      }
    }
  }
  return { sent }
}

export async function notifyUser(userId, { title, body, url, type = 'update', eventId = null }) {
  const db = await getDb()
  const doc = {
    id: crypto.randomUUID(),
    userId, title, body, url, type, eventId,
    createdAt: new Date(), readAt: null,
  }
  await db.collection('notifications').insertOne(doc)
  await sendPushToUser(userId, { title, body, url, tag: type })
  return doc
}
