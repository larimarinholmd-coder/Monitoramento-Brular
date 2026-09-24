'use client'
import { useEffect, useState, useCallback } from 'react'

// React hook that keeps the current user + entitlements in sync via the backend.
export function useCurrentUser() {
  const [state, setState] = useState({ loading: true, user: null, entitlements: { hasAllAccess: false, channels: [], productIds: [] } })

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/me', { cache: 'no-store' })
      const d = await r.json()
      setState({ loading: false, user: d.user, entitlements: d.entitlements || { hasAllAccess: false, channels: [], productIds: [] } })
    } catch {
      setState(s => ({ ...s, loading: false }))
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])
  useEffect(() => {
    const h = () => refresh()
    window.addEventListener('radar-user-change', h)
    return () => window.removeEventListener('radar-user-change', h)
  }, [refresh])

  return { ...state, refresh }
}

export function fireUserChange() {
  window.dispatchEvent(new CustomEvent('radar-user-change'))
}

export function greetingFor() {
  const h = new Date().getHours()
  if (h < 6) return 'Boa madrugada'
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function userHasChannel(entitlements, channelId) {
  if (!entitlements) return false
  if (entitlements.hasAllAccess) return true
  return entitlements.channels?.includes(channelId)
}
