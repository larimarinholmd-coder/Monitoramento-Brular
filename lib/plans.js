// Server-authoritative plans. Never trust prices from the client.
export const CHANNELS = [
  { id: 'politica', name: 'Política', color: '#ef4444', tagline: 'Poder, decisões, impacto real.', price: 14.90 },
  { id: 'futebol', name: 'Futebol', color: '#10b981', tagline: 'Times, transferências, bastidores.', price: 14.90 },
  { id: 'celebridades', name: 'Celebridades', color: '#a855f7', tagline: 'Entretenimento, cultura, fama.', price: 12.90 },
  { id: 'mundo', name: 'Mundo', color: '#3b82f6', tagline: 'Geopolítica, ciência, tendências globais.', price: 14.90 },
]

export const ALL_ACCESS_PRICE = 34.90

export const PLANS = {
  'canal-politica-30d':     { productId: 'channel:politica',     title: 'Canal Política — 30 dias',     price: 14.90, days: 30 },
  'canal-futebol-30d':      { productId: 'channel:futebol',      title: 'Canal Futebol — 30 dias',      price: 14.90, days: 30 },
  'canal-celebridades-30d': { productId: 'channel:celebridades', title: 'Canal Celebridades — 30 dias', price: 12.90, days: 30 },
  'canal-mundo-30d':        { productId: 'channel:mundo',        title: 'Canal Mundo — 30 dias',        price: 14.90, days: 30 },
  'all-access-30d':         { productId: 'all-access',           title: 'All Access — 30 dias',         price: 34.90, days: 30 },
}

export function getPlan(planId) { return PLANS[planId] || null }
export function getChannelById(id) { return CHANNELS.find(c => c.id === id) }
