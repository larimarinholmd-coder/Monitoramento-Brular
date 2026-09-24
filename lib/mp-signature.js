import { createHmac, timingSafeEqual } from 'node:crypto'

// Mercado Pago webhook signature validation.
// Header format: 'x-signature: ts=<epoch>,v1=<hmacsha256>'
// Manifest: id:<data.id>;request-id:<x-request-id>;ts:<ts>;

export function validMpSignature(signature, requestId, dataId) {
  if (!process.env.MP_WEBHOOK_SECRET) return null // opt-out until configured
  if (!signature || !requestId || !dataId) return false
  const parts = Object.fromEntries(
    signature.split(',').map(x => {
      const i = x.indexOf('=')
      return [x.slice(0, i).trim(), x.slice(i + 1).trim()]
    })
  )
  if (!parts.ts || !parts.v1) return false
  const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`
  const expected = createHmac('sha256', process.env.MP_WEBHOOK_SECRET).update(manifest).digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(parts.v1, 'utf8')
  return a.length === b.length && timingSafeEqual(a, b)
}
