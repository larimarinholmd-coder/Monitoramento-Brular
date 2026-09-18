'use client'
import { Header } from '@/components/radar/Header'
import { CHANNELS, ALL_ACCESS_PRICE } from '@/lib/data/events'
import { getUser, setUser, hasAccessToChannel } from '@/lib/store/user'
import { Check, Lock, ArrowRight, Zap, Radar, Sparkles, Bell, Rss, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const FREE_FEATURES = ['Manchetes principais', 'Home básica', 'Busca limitada', 'Preview de eventos', 'Canal Mundo (parcial)']
const PREMIUM_FEATURES = [
  { icon: Zap, label: 'Em 1 Minuto ilimitado' },
  { icon: Radar, label: 'Enquanto Você Estava Fora' },
  { icon: Bell, label: 'Alertas avançados por assunto' },
  { icon: Rss, label: 'Acompanhamento inteligente de casos' },
  { icon: Sparkles, label: 'Resumos da manhã e do fim do dia' },
  { icon: MessageSquare, label: 'Comunidade Premium completa' },
]

function PlansPage() {
  const [user, setU] = useState(null)
  useEffect(() => {
    setU(getUser())
    const h = (e) => setU(e.detail)
    window.addEventListener('radar-user-change', h)
    return () => window.removeEventListener('radar-user-change', h)
  }, [])

  const subscribe = (channelId) => {
    // Phase 1: simulate subscription (Phase 2 = Mercado Pago checkout)
    const cur = getUser()
    const next = cur.subscribedChannels.includes(channelId) ? cur.subscribedChannels : [...cur.subscribedChannels, channelId]
    setUser({ subscribedChannels: next })
    toast.success('Canal desbloqueado (demo)', { description: 'Na Fase 2 isso vai para o checkout Mercado Pago com webhook + entitlement real.' })
  }

  const subscribeAll = () => {
    setUser({ hasAllAccess: true, subscribedChannels: CHANNELS.map(c => c.id) })
    toast.success('All Access ativado (demo)', { description: 'Todos os canais liberados. Volte à Home para ver a diferença.' })
  }

  if (!user) return <div className="min-h-screen bg-[#0a0d16]" />

  return (
    <div className="min-h-screen bg-[#0a0d16] text-white">
      <Header />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-14">
          <div className="text-xs font-bold tracking-widest text-orange-300 uppercase mb-3">Complete seu Radar</div>
          <h1 className="font-serif-display text-5xl md:text-7xl leading-[1] tracking-tight">Você acompanha.<br /><span className="text-emerald-300">Nós acompanhamos<br />por você.</span></h1>
          <p className="mt-6 text-lg text-white/60 max-w-xl mx-auto">O Free demonstra valor. O Premium entrega controle. A Comunidade entrega participação.</p>
        </div>

        {/* All Access hero */}
        <div className="relative rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/25 via-[#0d1220] to-[#0a0d16] p-8 md:p-12 mb-14 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-emerald-300 uppercase mb-3">
                <Sparkles className="h-3.5 w-3.5" /> RECOMENDADO • ALL ACCESS
              </div>
              <h2 className="font-serif-display text-4xl md:text-5xl leading-tight mb-4">Tudo o que o Radar detecta,<br />sem filtros pra você.</h2>
              <p className="text-white/70 text-lg mb-6">4 canais liberados + todos os recursos Premium + comunidade completa.</p>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-black">R$ {ALL_ACCESS_PRICE.toFixed(2).replace('.', ',')}</span>
                <span className="text-white/50">/mês</span>
              </div>
              <button onClick={subscribeAll} className="radar-grad-premium text-black font-bold py-4 px-8 rounded-xl inline-flex items-center gap-2 hover:scale-[1.02] transition">
                {user.hasAllAccess ? <><Check className="h-5 w-5" /> Ativo</> : <>Liberar All Access <ArrowRight className="h-5 w-5" /></>}
              </button>
              <div className="text-xs text-white/50 mt-3">Cancele quando quiser • sem letra miúda</div>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 self-center">
              {PREMIUM_FEATURES.map(f => (
                <li key={f.label} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <f.icon className="h-4 w-4 text-emerald-300" />
                  </div>
                  <span className="text-sm text-white/85 pt-1">{f.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Individual channels */}
        <div className="mb-6">
          <h3 className="font-serif-display text-3xl mb-2">Ou desbloqueie por canal</h3>
          <p className="text-white/50">Quer só o que interessa? Assine só os canais que você acompanha.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {CHANNELS.map(c => {
            const active = hasAccessToChannel(user, c.id)
            return (
              <div key={c.id} className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex flex-col">
                <span className="text-xs font-black tracking-widest uppercase mb-2" style={{color: c.color}}>{c.name}</span>
                <p className="text-sm text-white/60 mb-6 flex-1">{c.tagline}</p>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-2xl font-bold">R$ {c.price.toFixed(2).replace('.', ',')}</span>
                  <span className="text-xs text-white/50">/mês</span>
                </div>
                <button onClick={() => subscribe(c.id)} disabled={active} className={`w-full py-2.5 rounded-lg text-sm font-bold transition ${active ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-white text-black hover:bg-white/90'}`}>
                  {active ? <><Check className="inline h-4 w-4 mr-1" /> Ativo</> : `Assinar ${c.name}`}
                </button>
              </div>
            )
          })}
        </div>

        {/* Free vs Premium */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="text-xs font-bold tracking-widest uppercase text-white/40 mb-2">Free — você acompanha</div>
            <ul className="space-y-2 mt-4">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-white/70"><Check className="h-4 w-4 text-white/40" /> {f}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] p-6">
            <div className="text-xs font-bold tracking-widest uppercase text-emerald-300 mb-2">Premium — nós acompanhamos por você</div>
            <ul className="space-y-2 mt-4">
              {PREMIUM_FEATURES.map(f => (
                <li key={f.label} className="flex items-center gap-2 text-sm text-white"><Check className="h-4 w-4 text-emerald-400" /> {f.label}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-sm text-white/50">
          <strong className="text-white/70">Fase 1 (demo):</strong> os planos ativam localmente para você experimentar o app com e sem paywall. <br />
          <strong className="text-white/70">Fase 2:</strong> checkout próprio integrado ao Mercado Pago com webhook + entitlement server-side.
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-white/50 hover:text-white">← Voltar para minha Home</Link>
        </div>
      </main>
    </div>
  )
}

export default PlansPage
