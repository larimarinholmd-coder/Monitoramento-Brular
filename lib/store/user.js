// Simple client-side user state (localStorage).
// Phase 2 will replace with real auth + backend entitlements.
'use client'

const KEY = 'radar_user_v1'

const DEFAULT = {
  name: '',
  hasOnboarded: false,
  subscribedChannels: [], // e.g. ['mundo'] (free tier gets 'mundo' partial)
  hasAllAccess: false,
  followedTopics: [], // e.g. ['Flamengo', 'STF']
  lastActiveAt: null, // ISO string
  viewedEvents: [], // event ids viewed today
}

export function getUser() {
  if (typeof window === 'undefined') return DEFAULT
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT
    return { ...DEFAULT, ...JSON.parse(raw) }
  } catch { return DEFAULT }
}

export function setUser(patch) {
  const cur = getUser()
  const next = { ...cur, ...patch }
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('radar-user-change', { detail: next }))
  return next
}

export function resetUser() {
  localStorage.removeItem(KEY)
  window.dispatchEvent(new CustomEvent('radar-user-change', { detail: DEFAULT }))
}

export function hasAccessToChannel(user, channelId) {
  if (!user) return false
  if (user.hasAllAccess) return true
  return user.subscribedChannels?.includes(channelId)
}

export function timeSinceLast(user) {
  if (!user?.lastActiveAt) return null
  const diffMs = Date.now() - new Date(user.lastActiveAt).getTime()
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  return { hours, ms: diffMs }
}

export function greetingFor() {
  const h = new Date().getHours()
  if (h < 6) return 'Boa madrugada'
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}
