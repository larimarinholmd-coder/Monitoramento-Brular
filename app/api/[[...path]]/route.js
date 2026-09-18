import { NextResponse } from 'next/server'
import { EVENTS, CHANNELS, getEventBySlug, getChannelStats } from '@/lib/data/events'

// Phase 1 API — serves the same mocked data. Client also has direct access via lib/data.
// Phase 2 will move all reads through here with real DB + entitlement checks.

async function handler(request, { params }) {
  const path = (params?.path || []).join('/')

  if (request.method === 'GET') {
    if (path === '' || path === 'health') return NextResponse.json({ ok: true, phase: 1 })
    if (path === 'channels') return NextResponse.json({ channels: CHANNELS.map(c => ({ ...c, stats: getChannelStats(c.id) })) })
    if (path === 'events') return NextResponse.json({ events: EVENTS })
    if (path.startsWith('events/')) {
      const slug = path.replace('events/', '')
      const ev = getEventBySlug(slug)
      if (!ev) return NextResponse.json({ error: 'not_found' }, { status: 404 })
      return NextResponse.json({ event: ev })
    }
  }

  return NextResponse.json({ error: 'not_implemented' }, { status: 404 })
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
