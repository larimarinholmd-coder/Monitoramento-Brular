import { MongoClient } from 'mongodb'

const uri = process.env.MONGO_URL
const dbName = process.env.DB_NAME || 'radar_pessoal'

let client
let connectPromise

export async function getDb() {
  if (!client) {
    client = new MongoClient(uri, { maxPoolSize: 10 })
    connectPromise = client.connect()
  }
  await connectPromise
  return client.db(dbName)
}

export async function getClient() {
  await getDb()
  return client
}

let indexesReady
export async function ensureIndexes() {
  if (indexesReady) return indexesReady
  indexesReady = (async () => {
    const db = await getDb()
    await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true })
    await db.collection('users').createIndex({ googleId: 1 }, { unique: true, sparse: true })
    await db.collection('events').createIndex({ slug: 1 }, { unique: true })
    await db.collection('events').createIndex({ channel: 1, importance: -1 })
    await db.collection('events').createIndex({ createdAt: -1 })
    await db.collection('articles').createIndex({ url: 1 }, { unique: true })
    await db.collection('comments').createIndex({ eventId: 1, createdAt: -1 })
    await db.collection('orders').createIndex({ orderId: 1 }, { unique: true })
    await db.collection('payments').createIndex({ mpPaymentId: 1 }, { unique: true })
    await db.collection('webhook_events').createIndex({ eventId: 1 }, { unique: true })
    await db.collection('subscriptions').createIndex({ userId: 1, productId: 1 }, { unique: true })
    await db.collection('entitlements').createIndex({ userId: 1, productId: 1 }, { unique: true })
    await db.collection('push_subscriptions').createIndex({ userId: 1, endpoint: 1 }, { unique: true })
    await db.collection('notifications').createIndex({ userId: 1, createdAt: -1 })
  })()
  return indexesReady
}
