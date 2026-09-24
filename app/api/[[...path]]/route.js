import { NextResponse } from 'next/server'
import { getDb, ensureIndexes } from '@/lib/mongo'
import { seedIfEmpty } from '@/lib/seed'
import { CHANNELS, PLANS, getPlan, ALL_ACCESS_PRICE } from '@/lib/plans'
import { getSessionUserId, setSessionCookie, clearSessionCookie, hashPassword, verifyPassword, getCurrentUser } from '@/lib/auth'
import { getUserEntitlements, userHasChannel, grantEntitlement } from '@/lib/entitlements'
import { preferenceClient, paymentClient } from '@/lib/mercadopago'
import { validMpSignature } from '@/lib/mp-signature'
import { runIngest } from '@/lib/ingest'
import { sendPushToUser, notifyUser } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

function ok(data, init) { return NextResponse.json(data, init) }
function fail(status, error, extra = {}) { return NextResponse.json({ error, ...extra }, { status }) }

async function requireUser() {
  const uid = await getSessionUserId()
  if (!uid) return null
  const db = await getDb()
  const u = await db.collection('users').findOne({ id: uid })
  return u
}

// Compose an event response with entitlement-aware masking.
function maskEvent(evt, entitlements) {
  const locked = evt.isPremium && !userHasChannel(entitlements, evt.channel)
  if (!locked) return { ...evt, locked: false, _id: undefined }
  return {
    ...evt,
    fullContent: null, // masked
    locked: true,
    _id: undefined,
  }
}

async function handler(request, { params }) {
  await ensureIndexes()
  await seedIfEmpty()

  const path = (params?.path || []).join('/')
  const method = request.method
  const url = new URL(request.url)
  const db = await getDb()

  try {
    // ============ HEALTH / ROOT ============
    if (path === '' || path === 'health') {
      return ok({ ok: true, phase: 2, features: ['auth','mercadopago','rss','community','push'] })
    }

    // ============ AUTH ============
    if (path === 'auth/signup' && method === 'POST') {
      const { email, password, name } = await request.json()
      if (!email || !password || password.length < 6) return fail(400, 'invalid_input')
      const exists = await db.collection('users').findOne({ email: email.toLowerCase() })
      if (exists) return fail(409, 'email_exists')
      const id = crypto.randomUUID()
      await db.collection('users').insertOne({
        id, email: email.toLowerCase(), name: name || email.split('@')[0],
        passwordHash: await hashPassword(password),
        provider: 'email',
        followedTopics: [], hasOnboarded: false,
        lastActiveAt: new Date(), createdAt: new Date(),
      })
      await setSessionCookie(id)
      return ok({ ok: true, userId: id })
    }

    if (path === 'auth/login' && method === 'POST') {
      const { email, password } = await request.json()
      const u = await db.collection('users').findOne({ email: (email || '').toLowerCase() })
      if (!u || !u.passwordHash) return fail(401, 'invalid_credentials')
      const okPw = await verifyPassword(password, u.passwordHash)
      if (!okPw) return fail(401, 'invalid_credentials')
      await setSessionCookie(u.id)
      await db.collection('users').updateOne({ id: u.id }, { $set: { lastActiveAt: new Date() } })
      return ok({ ok: true, userId: u.id })
    }

    if (path === 'auth/logout' && method === 'POST') {
      await clearSessionCookie()
      return ok({ ok: true })
    }

    if (path === 'auth/me' && method === 'GET') {
      const user = await getCurrentUser()
      if (!user) return ok({ user: null })
      const ent = await getUserEntitlements(user.id)
      return ok({
        user: {
          id: user.id, email: user.email, name: user.name, avatar: user.avatar || null,
          hasOnboarded: !!user.hasOnboarded,
          followedTopics: user.followedTopics || [],
          lastActiveAt: user.lastActiveAt,
        },
        entitlements: {
          hasAllAccess: ent.hasAllAccess,
          channels: [...ent.channels],
          productIds: [...ent.productIds],
        },
      })
    }

    // Google OAuth ---------------------------------------------------
    if (path === 'auth/google' && method === 'GET') {
      const clientId = process.env.GOOGLE_CLIENT_ID
      if (!clientId) return fail(501, 'google_not_configured', { message: 'Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env' })
      const redirectUri = `${APP_URL}/api/auth/google/callback`
      const scope = encodeURIComponent('openid email profile')
      const state = crypto.randomUUID()
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}&prompt=select_account`
      return NextResponse.redirect(authUrl)
    }

    if (path === 'auth/google/callback' && method === 'GET') {
      const code = url.searchParams.get('code')
      const clientId = process.env.GOOGLE_CLIENT_ID
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET
      if (!code || !clientId || !clientSecret) return NextResponse.redirect(`${APP_URL}/login?error=google_config`)
      const redirectUri = `${APP_URL}/api/auth/google/callback`
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
      })
      const tokens = await tokenRes.json()
      if (!tokens.access_token) return NextResponse.redirect(`${APP_URL}/login?error=google_token`)
      const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` } })
      const profile = await infoRes.json()
      if (!profile.sub) return NextResponse.redirect(`${APP_URL}/login?error=google_profile`)

      let u = await db.collection('users').findOne({ googleId: profile.sub })
      if (!u) {
        u = await db.collection('users').findOne({ email: profile.email?.toLowerCase() })
        if (u) {
          await db.collection('users').updateOne({ id: u.id }, { $set: { googleId: profile.sub, avatar: profile.picture, provider: 'google' } })
        } else {
          const id = crypto.randomUUID()
          const doc = {
            id, email: profile.email?.toLowerCase(), name: profile.name || profile.given_name || 'Usuário',
            avatar: profile.picture, googleId: profile.sub, provider: 'google',
            followedTopics: [], hasOnboarded: false,
            lastActiveAt: new Date(), createdAt: new Date(),
          }
          await db.collection('users').insertOne(doc)
          u = doc
        }
      }
      await setSessionCookie(u.id)
      await db.collection('users').updateOne({ id: u.id }, { $set: { lastActiveAt: new Date() } })
      return NextResponse.redirect(`${APP_URL}/`)
    }

    // ============ USER PROFILE ============
    if (path === 'user/onboarding' && method === 'POST') {
      const user = await requireUser()
      if (!user) return fail(401, 'unauthorized')
      const { name, followedTopics } = await request.json()
      await db.collection('users').updateOne({ id: user.id }, {
        $set: { name: name || user.name, followedTopics: Array.isArray(followedTopics) ? followedTopics.slice(0, 20) : [], hasOnboarded: true, lastActiveAt: new Date() },
      })
      return ok({ ok: true })
    }

    if (path === 'user/follow' && method === 'POST') {
      const user = await requireUser()
      if (!user) return fail(401, 'unauthorized')
      const { topic, action } = await request.json()
      const op = action === 'unfollow'
        ? { $pull: { followedTopics: topic } }
        : { $addToSet: { followedTopics: topic } }
      await db.collection('users').updateOne({ id: user.id }, op)
      return ok({ ok: true })
    }

    // ============ CHANNELS ============
    if (path === 'channels' && method === 'GET') {
      const user = await requireUser()
      const ent = await getUserEntitlements(user?.id)
      const out = []
      for (const c of CHANNELS) {
        const total = await db.collection('events').countDocuments({ channel: c.id })
        const important = await db.collection('events').countDocuments({ channel: c.id, importance: { $gte: 4 } })
        const live = await db.collection('events').countDocuments({ channel: c.id, status: 'agora' })
        out.push({ ...c, stats: { total, important, live }, unlocked: userHasChannel(ent, c.id) })
      }
      return ok({ channels: out, allAccessPrice: ALL_ACCESS_PRICE })
    }

    // ============ EVENTS ============
    if (path === 'events' && method === 'GET') {
      const user = await requireUser()
      const ent = await getUserEntitlements(user?.id)
      const channel = url.searchParams.get('channel')
      const q = channel ? { channel } : {}
      const events = await db.collection('events').find(q).sort({ createdAt: -1 }).limit(50).toArray()
      return ok({ events: events.map(e => maskEvent(e, ent)) })
    }

    if (path.startsWith('events/') && !path.includes('/comments')) {
      const slug = path.split('/')[1]
      if (method === 'GET') {
        const evt = await db.collection('events').findOne({ slug })
        if (!evt) return fail(404, 'not_found')
        const user = await requireUser()
        const ent = await getUserEntitlements(user?.id)
        return ok({ event: maskEvent(evt, ent) })
      }
    }

    // ============ COMMENTS ============
    if (path.startsWith('events/') && path.endsWith('/comments')) {
      const slug = path.split('/')[1]
      const evt = await db.collection('events').findOne({ slug })
      if (!evt) return fail(404, 'event_not_found')

      if (method === 'GET') {
        const comments = await db.collection('comments').find({ eventId: evt.id, parentId: null }).sort({ createdAt: -1 }).limit(50).toArray()
        // Fetch replies for each
        const withReplies = await Promise.all(comments.map(async c => {
          const replies = await db.collection('comments').find({ parentId: c.id }).sort({ createdAt: 1 }).limit(20).toArray()
          return { ...c, _id: undefined, replies: replies.map(r => ({ ...r, _id: undefined })) }
        }))
        return ok({ comments: withReplies, count: await db.collection('comments').countDocuments({ eventId: evt.id }) })
      }

      if (method === 'POST') {
        const user = await requireUser()
        if (!user) return fail(401, 'unauthorized')
        const ent = await getUserEntitlements(user.id)
        if (evt.isPremium && !userHasChannel(ent, evt.channel)) return fail(403, 'premium_required', { productId: `channel:${evt.channel}` })
        const { text, parentId } = await request.json()
        const clean = String(text || '').replace(/<[^>]*>/g, '').slice(0, 1000).trim()
        if (!clean) return fail(400, 'empty_text')
        const doc = {
          id: crypto.randomUUID(),
          eventId: evt.id, eventSlug: slug,
          userId: user.id, userName: user.name, userAvatar: user.avatar || null,
          text: clean, parentId: parentId || null,
          likes: [], reports: [],
          createdAt: new Date(),
        }
        await db.collection('comments').insertOne(doc)
        await db.collection('events').updateOne({ id: evt.id }, { $inc: { communityCount: 1 } })
        return ok({ comment: { ...doc, _id: undefined } })
      }
    }

    if (path.startsWith('comments/') && path.endsWith('/like') && method === 'POST') {
      const user = await requireUser()
      if (!user) return fail(401, 'unauthorized')
      const commentId = path.split('/')[1]
      const c = await db.collection('comments').findOne({ id: commentId })
      if (!c) return fail(404, 'not_found')
      const has = (c.likes || []).includes(user.id)
      await db.collection('comments').updateOne({ id: commentId },
        has ? { $pull: { likes: user.id } } : { $addToSet: { likes: user.id } })
      return ok({ liked: !has, count: (c.likes?.length || 0) + (has ? -1 : 1) })
    }

    if (path.startsWith('comments/') && path.endsWith('/report') && method === 'POST') {
      const user = await requireUser()
      if (!user) return fail(401, 'unauthorized')
      const commentId = path.split('/')[1]
      await db.collection('comments').updateOne({ id: commentId }, { $addToSet: { reports: user.id } })
      return ok({ ok: true })
    }

    // ============ CHECKOUT (Mercado Pago) ============
    if (path === 'checkout/preference' && method === 'POST') {
      const user = await requireUser()
      if (!user) return fail(401, 'unauthorized')
      const { planId } = await request.json()
      const plan = getPlan(planId)
      if (!plan) return fail(400, 'invalid_plan')

      const orderId = crypto.randomUUID()
      const externalReference = `${user.id}|${planId}|${orderId}`
      await db.collection('orders').insertOne({
        orderId, userId: user.id, planId, productId: plan.productId,
        externalReference, amount: plan.price, status: 'pending', createdAt: new Date(),
      })

      const pref = await preferenceClient.create({
        body: {
          items: [{ id: planId, title: plan.title, quantity: 1, currency_id: 'BRL', unit_price: plan.price }],
          payer: user.email ? { email: user.email, name: user.name } : undefined,
          external_reference: externalReference,
          notification_url: `${APP_URL}/api/webhooks/mercadopago`,
          back_urls: {
            success: `${APP_URL}/checkout/sucesso?order=${orderId}`,
            pending: `${APP_URL}/checkout/pendente?order=${orderId}`,
            failure: `${APP_URL}/checkout/erro?order=${orderId}`,
          },
          auto_return: 'approved',
          metadata: { userId: user.id, planId, orderId },
        },
      })

      await db.collection('orders').updateOne({ orderId }, { $set: { preferenceId: pref.id } })
      return ok({ initPoint: pref.init_point || pref.sandbox_init_point, preferenceId: pref.id, orderId })
    }

    if (path === 'checkout/order-status' && method === 'GET') {
      const user = await requireUser()
      if (!user) return fail(401, 'unauthorized')
      const orderId = url.searchParams.get('orderId')
      const order = await db.collection('orders').findOne({ orderId, userId: user.id })
      if (!order) return fail(404, 'not_found')
      const ent = await getUserEntitlements(user.id)
      return ok({
        order: { orderId: order.orderId, status: order.status, productId: order.productId, planId: order.planId, amount: order.amount },
        entitlement: {
          active: ent.productIds.has(order.productId) || ent.hasAllAccess,
          hasAllAccess: ent.hasAllAccess,
        },
      })
    }

    // ============ WEBHOOK MERCADO PAGO ============
    if (path === 'webhooks/mercadopago' && method === 'POST') {
      const dataId = url.searchParams.get('data.id') || url.searchParams.get('id')
      const requestId = request.headers.get('x-request-id')
      const signature = request.headers.get('x-signature')

      // Signature check: opt-in (only enforced when MP_WEBHOOK_SECRET is set)
      if (process.env.MP_WEBHOOK_SECRET) {
        const valid = validMpSignature(signature, requestId, dataId)
        if (valid === false) return fail(401, 'invalid_signature')
      }

      const body = await request.json().catch(() => ({}))
      const type = body.type || body.action || url.searchParams.get('type') || ''
      if (!/payment/i.test(type) || !dataId) return ok({ received: true, skipped: 'not_payment' })

      const eventId = String(body.id ?? `${type}:${dataId}`)
      // idempotency: insert or short-circuit
      try {
        await db.collection('webhook_events').insertOne({
          eventId, mpPaymentId: String(dataId), type, status: 'processing', receivedAt: new Date(), payload: body,
        })
      } catch {
        const existing = await db.collection('webhook_events').findOne({ eventId })
        if (existing?.status === 'processed') return ok({ received: true, dedup: true })
      }

      let payment
      try {
        payment = await paymentClient.get({ id: String(dataId) })
      } catch (e) {
        await db.collection('webhook_events').updateOne({ eventId }, { $set: { status: 'failed', error: e.message } })
        return ok({ received: true, error: 'fetch_failed' })
      }

      const externalReference = payment.external_reference || payment.metadata?.externalReference || ''
      const [userId, planId] = String(externalReference).split('|')
      const plan = getPlan(planId)

      await db.collection('payments').updateOne(
        { mpPaymentId: String(payment.id) },
        { $set: {
            userId, planId, productId: plan?.productId,
            status: payment.status, statusDetail: payment.status_detail,
            amount: payment.transaction_amount, externalReference,
            preferenceId: payment.metadata?.preference_id, updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      )

      if (payment.status === 'approved' && plan && userId) {
        await grantEntitlement({ userId, productId: plan.productId, days: plan.days, sourcePaymentId: String(payment.id) })
        await db.collection('orders').updateOne({ externalReference }, { $set: { status: 'approved', paidAt: new Date() } })
        await notifyUser(userId, {
          title: '✓ Acesso liberado',
          body: `${plan.title} está ativo. Aproveite.`,
          url: '/', type: 'entitlement',
        }).catch(() => {})
      } else if (['refunded', 'charged_back', 'cancelled'].includes(payment.status)) {
        // Revoke entitlement
        if (plan && userId) {
          await db.collection('entitlements').updateOne({ userId, productId: plan.productId }, { $set: { active: false, updatedAt: new Date() } })
          await db.collection('subscriptions').updateOne({ userId, productId: plan.productId }, { $set: { status: 'canceled', updatedAt: new Date() } })
        }
      }

      await db.collection('webhook_events').updateOne({ eventId }, { $set: { status: 'processed', processedAt: new Date() } })
      return ok({ received: true })
    }

    // ============ PUSH ============
    if (path === 'push/subscribe' && method === 'POST') {
      const user = await requireUser()
      if (!user) return fail(401, 'unauthorized')
      const { subscription } = await request.json()
      if (!subscription?.endpoint) return fail(400, 'invalid_subscription')
      await db.collection('push_subscriptions').updateOne(
        { endpoint: subscription.endpoint },
        { $set: { userId: user.id, endpoint: subscription.endpoint, keys: subscription.keys, updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      )
      return ok({ ok: true })
    }

    if (path === 'push/test' && method === 'POST') {
      const user = await requireUser()
      if (!user) return fail(401, 'unauthorized')
      const res = await notifyUser(user.id, {
        title: '⚡ Radar Pessoal',
        body: 'Isso é uma notificação de teste. Se você recebeu, está tudo funcionando.',
        url: '/', type: 'test',
      })
      return ok({ sent: true, notification: res })
    }

    // ============ NOTIFICATIONS ============
    if (path === 'notifications' && method === 'GET') {
      const user = await requireUser()
      if (!user) return ok({ notifications: [] })
      const list = await db.collection('notifications').find({ userId: user.id }).sort({ createdAt: -1 }).limit(30).toArray()
      return ok({ notifications: list.map(n => ({ ...n, _id: undefined })) })
    }

    if (path === 'notifications/read-all' && method === 'POST') {
      const user = await requireUser()
      if (!user) return fail(401, 'unauthorized')
      await db.collection('notifications').updateMany({ userId: user.id, readAt: null }, { $set: { readAt: new Date() } })
      return ok({ ok: true })
    }

    // ============ ADMIN / INGEST ============
    if (path === 'ingest/run' && method === 'POST') {
      // Admin gate (MVP: allow any authenticated user for demo; harden later)
      const body = await request.json().catch(() => ({}))
      const useLLM = body.useLLM !== false
      const stats = await runIngest({ useLLM, limitPerSource: body.limit || 6 })
      return ok({ ok: true, stats })
    }

    return fail(404, 'not_found')

  } catch (err) {
    console.error('API error', path, err)
    return fail(500, 'server_error', { message: err.message })
  }
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
