import { getDb } from './mongo'

// Entitlements: 'channel:politica', 'channel:futebol', 'all-access', etc.
// The all-access entitlement grants every channel.

export async function getUserEntitlements(userId) {
  if (!userId) return { productIds: new Set(), hasAllAccess: false, channels: new Set() }
  const db = await getDb()
  const now = new Date()
  const items = await db.collection('entitlements')
    .find({ userId, active: true, expiresAt: { $gt: now } })
    .toArray()

  const productIds = new Set(items.map(i => i.productId))
  const hasAllAccess = productIds.has('all-access')
  const channels = new Set()
  if (hasAllAccess) {
    ;['politica','futebol','celebridades','mundo'].forEach(c => channels.add(c))
  } else {
    for (const p of productIds) {
      if (p.startsWith('channel:')) channels.add(p.split(':')[1])
    }
  }
  return { productIds, hasAllAccess, channels, items }
}

export function userHasChannel(entitlements, channelId) {
  return entitlements.hasAllAccess || entitlements.channels.has(channelId)
}

export async function grantEntitlement({ userId, productId, days = 30, sourcePaymentId }) {
  const db = await getDb()
  const startsAt = new Date()
  const expiresAt = new Date(startsAt.getTime() + days * 24 * 60 * 60 * 1000)
  await db.collection('entitlements').updateOne(
    { userId, productId },
    { $set: { active: true, expiresAt, sourcePaymentId, updatedAt: new Date() },
      $setOnInsert: { userId, productId, createdAt: new Date() } },
    { upsert: true }
  )
  await db.collection('subscriptions').updateOne(
    { userId, productId },
    { $set: { status: 'active', startsAt, expiresAt, mpPaymentId: sourcePaymentId, updatedAt: new Date() },
      $setOnInsert: { userId, productId, createdAt: new Date() } },
    { upsert: true }
  )
  return { userId, productId, active: true, expiresAt }
}
