'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/radar/Header'
import { Check, Loader2, Clock } from 'lucide-react'

function SuccessPage() {
  const params = useSearchParams()
  const orderId = params.get('order')
  const [status, setStatus] = useState('checking')
  const [ent, setEnt] = useState(null)

  useEffect(() => {
    if (!orderId) { setStatus('error'); return }
    let tries = 0
    const tick = async () => {
      tries++
      try {
        const r = await fetch(`/api/checkout/order-status?orderId=${orderId}`, { cache: 'no-store' })
        const d = await r.json()
        if (d.entitlement?.active) { setStatus('active'); setEnt(d); return }
        if (d.order?.status === 'approved') { setStatus('active'); setEnt(d); return }
      } catch {}
      if (tries < 20) setTimeout(tick, 2500)
      else setStatus('slow')
    }
    tick()
  }, [orderId])

  return (
    <div className="min-h-screen bg-[#0a0d16] text-white">
      <Header />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-16 text-center">
        {status === 'checking' && (
          <>
            <Loader2 className="h-16 w-16 mx-auto mb-6 text-orange-400 animate-spin" />
            <h1 className="font-serif-display text-4xl md:text-5xl mb-3">Confirmando seu pagamento…</h1>
            <p className="text-white/60">Estamos aguardando a confirmação do Mercado Pago.<br />Isso costuma levar poucos segundos.</p>
          </>
        )}
        {status === 'active' && (
          <>
            <div className="h-20 w-20 rounded-full radar-grad-premium mx-auto flex items-center justify-center mb-6">
              <Check className="h-10 w-10 text-black" strokeWidth={3} />
            </div>
            <h1 className="font-serif-display text-4xl md:text-5xl mb-3">Seu acesso está ativo.</h1>
            <p className="text-white/60 mb-8">Você agora tem tudo do plano contratado — alertas, comunidade e conteúdo exclusivo.</p>
            <Link href="/" className="radar-grad-orange text-black font-bold py-3.5 px-8 rounded-xl inline-flex items-center gap-2">
              Ir para minha Home
            </Link>
          </>
        )}
        {status === 'slow' && (
          <>
            <Clock className="h-16 w-16 mx-auto mb-6 text-amber-400" />
            <h1 className="font-serif-display text-4xl mb-3">Pagamento em processamento</h1>
            <p className="text-white/60 mb-6">O Mercado Pago ainda está confirmando. Você receberá uma notificação assim que o acesso for liberado.</p>
            <Link href="/" className="border border-white/15 px-6 py-3 rounded-lg hover:bg-white/5">Voltar para a Home</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="font-serif-display text-4xl mb-3">Ordem não encontrada</h1>
            <Link href="/planos" className="text-orange-300 underline">Voltar aos planos</Link>
          </>
        )}
      </main>
    </div>
  )
}

export default SuccessPage
