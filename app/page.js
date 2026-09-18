'use client'
import { useEffect, useMemo, useState } from 'react'
import { Header } from '@/components/radar/Header'
import { EventCard } from '@/components/radar/EventCard'
import { OneMinute } from '@/components/radar/OneMinute'
import { Onboarding } from '@/components/radar/Onboarding'
import { EVENTS, CHANNELS, getChannelStats, getEventsByChannel } from '@/lib/data/events'
import { getUser, hasAccessToChannel, greetingFor, setUser } from '@/lib/store/user'
import { Zap, ChevronRight, Lock, MessageSquare, Radar, Rss, Check, Bell, ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

function App() {
  const [user, setU] = useState(null)
  const [oneMinOpen, setOneMinOpen] = useState(false)
  const [showOnb, setShowOnb] = useState(false)

  useEffect(() => {
    const u = getUser()
    setU(u)
    if (!u.hasOnboarded) setShowOnb(true)
    else setUser({ lastActiveAt: u.lastActiveAt || new Date(Date.now() - 6*60*60*1000).toISOString() })
    const h = (e) => setU(e.detail)
    window.addEventListener('radar-user-change', h)
    return () => window.removeEventListener('radar-user-change', h)
  }, [])

  // Compute what user "missed since last visit": all events (mocked all as since-last)
  const missedCount = 7 // mocked realistic
  const hoursAway = 6

  const topEvents = useMemo(() => {
    // sort by importance and status priority
    const statusRank = { agora: 4, importante: 3, desenvolvimento: 2, atualizacao: 1 }
    return [...EVENTS].sort((a,b) => (b.importance*2 + statusRank[b.status]) - (a.importance*2 + statusRank[a.status]))
  }, [])

  const heroEvent = topEvents[0]
  const secondary = topEvents.slice(1, 3)
  const rest = topEvents.slice(3, 9)

  const oneMinuteFeed = useMemo(() => topEvents.slice(0, 5), [topEvents])

  const awayEvents = useMemo(() => topEvents.filter(e => e.importance >= 3).slice(0, 4), [topEvents])

  if (!user) return <div className="min-h-screen bg-[#0a0d16]" />

  const firstName = user.name ? user.name.split(' ')[0] : 'Você'
  const isFree = !user.hasAllAccess && user.subscribedChannels.length === 0

  const followEvent = (title) => {
    toast.success(`Você está acompanhando: ${title}`, { description: 'Avisaremos assim que houver atualização importante.' })
  }

  return (
    <div className="min-h-screen bg-[#0a0d16] text-white">
      <Onboarding open={showOnb} onDone={() => { setShowOnb(false); setU(getUser()); toast.success('Radar ativado!', { description: 'Confira sua primeira Home personalizada.' }) }} />
      <OneMinute open={oneMinOpen} onOpenChange={setOneMinOpen} events={oneMinuteFeed} user={user} />

      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-14">

        {/* 1. PRIMEIRA DOBRA — SAUDAÇÃO + EM 1 MINUTO */}
        <section className="relative overflow-hidden rounded-3xl radar-glass p-6 md:p-10">
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-orange-500/30 blur-3xl" />
            <div className="absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-purple-500/20 blur-3xl" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 text-xs text-white/50 mb-3">
              <span className="radar-pulse" /> Atualizado agora • <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <h1 className="font-serif-display text-4xl md:text-6xl leading-[1.02] tracking-tight">
              {greetingFor()}, {firstName}.
            </h1>
            <p className="mt-3 text-lg md:text-xl text-white/70 max-w-2xl">
              <span className="text-orange-300 font-semibold">{missedCount} acontecimentos importantes</span> desde sua última visita, há {hoursAway}h.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button onClick={() => setOneMinOpen(true)} className="group inline-flex items-center gap-3 radar-grad-orange text-black font-bold py-3.5 px-6 rounded-xl text-sm hover:scale-[1.02] transition">
                <Zap className="h-5 w-5" fill="currentColor" />
                Ver tudo em 1 minuto
                <ArrowRight className="h-4 w-4 -ml-1 group-hover:translate-x-0.5 transition" />
              </button>
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Rss className="h-4 w-4" />
                Personalizado para você com base em {user.followedTopics.length} assuntos seguidos
              </div>
            </div>
          </div>
        </section>

        {/* 2. SEUS CANAIS */}
        <section>
          <SectionTitle title="Seus Canais" subtitle="Onde seu Radar está apontado agora" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            {CHANNELS.map(c => {
              const stats = getChannelStats(c.id)
              const unlocked = hasAccessToChannel(user, c.id)
              return (
                <div key={c.id} className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${unlocked ? 'border-white/10 bg-white/[0.03]' : 'border-emerald-500/20 bg-emerald-500/[0.03]'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-xs font-black tracking-widest uppercase" style={{color: c.color}}>{c.name}</span>
                    {!unlocked && <Lock className="h-4 w-4 text-emerald-400" />}
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{stats.total}<span className="text-sm font-normal text-white/50 ml-1">novidades</span></div>
                    <div className="text-xs text-white/60">• {stats.important} importantes</div>
                    {stats.live > 0 && <div className="text-xs text-red-400 font-semibold flex items-center gap-1"><span className="radar-pulse" /> {stats.live} agora</div>}
                  </div>
                  {unlocked ? (
                    <button className="mt-4 text-xs font-semibold text-white/70 hover:text-white flex items-center gap-1">Abrir <ChevronRight className="h-3 w-3" /></button>
                  ) : (
                    <Link href="/planos" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-300 hover:text-emerald-200">
                      Desbloquear • R$ {c.price.toFixed(2).replace('.', ',')}/mês <ChevronRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* 3. ACONTECENDO AGORA — GRID EDITORIAL */}
        <section>
          <SectionTitle title="Acontecendo Agora" subtitle="O que o Radar detectou nas últimas horas" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5">
            <div className="lg:col-span-2">
              <EventCard event={heroEvent} size="hero" locked={heroEvent.isPremium && !hasAccessToChannel(user, heroEvent.channel)} />
            </div>
            <div className="grid grid-cols-1 gap-4">
              {secondary.map(e => (
                <EventCard key={e.id} event={e} size="sm" locked={e.isPremium && !hasAccessToChannel(user, e.channel)} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {rest.map(e => (
              <EventCard key={e.id} event={e} locked={e.isPremium && !hasAccessToChannel(user, e.channel)} />
            ))}
          </div>
        </section>

        {/* 4. ENQUANTO VOCÊ ESTAVA FORA */}
        <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-purple-900/20 via-transparent to-orange-900/10 p-6 md:p-10">
          <div className="flex items-start justify-between gap-6 flex-wrap mb-6">
            <div>
              <div className="text-xs font-bold tracking-widest text-purple-300 uppercase mb-2"><Clock className="inline h-3 w-3 mr-1" /> Enquanto você estava fora</div>
              <h2 className="font-serif-display text-3xl md:text-4xl leading-tight">Você ficou {hoursAway}h sem acessar.<br /><span className="text-white/60">{awayEvents.length} coisas importantes aconteceram.</span></h2>
            </div>
            <button onClick={() => setOneMinOpen(true)} className="shrink-0 inline-flex items-center gap-2 border border-white/15 hover:bg-white/5 text-sm font-semibold py-2.5 px-4 rounded-lg">
              <Zap className="h-4 w-4 text-orange-300" /> Resumo em 1 min
            </button>
          </div>
          <ol className="relative border-l border-white/10 ml-2 space-y-6">
            {awayEvents.map((e, i) => {
              const locked = e.isPremium && !hasAccessToChannel(user, e.channel)
              return (
                <li key={e.id} className="pl-6">
                  <span className="absolute -left-[7px] mt-1.5 h-3.5 w-3.5 rounded-full bg-orange-400 border-4 border-[#0a0d16]" />
                  <div className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-1">{e.updatedAt}</div>
                  <Link href={locked ? '/planos' : `/evento/${e.slug}`} className="block group">
                    <h3 className="font-semibold text-lg leading-tight group-hover:text-orange-300 transition">{e.title}</h3>
                    <p className="text-sm text-white/60 mt-1 line-clamp-2">{e.summary}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      {locked ? (
                        <span className="text-emerald-300 font-semibold flex items-center gap-1"><Lock className="h-3 w-3" /> Detalhes exclusivos para assinantes</span>
                      ) : (
                        <span className="text-white/50">Ver linha do tempo →</span>
                      )}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ol>
        </section>

        {/* 5. SEUS ACOMPANHAMENTOS */}
        {user.followedTopics.length > 0 && (
          <section>
            <SectionTitle title="Seus Acompanhamentos" subtitle="Somente novidades reais sobre o que você segue" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
              {user.followedTopics.slice(0, 6).map(t => {
                const rel = EVENTS.filter(e => e.topics.includes(t))
                return (
                  <div key={t} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{t}</div>
                      <div className="text-xs text-white/50 mt-0.5">
                        {rel.length === 0 ? 'Nenhuma novidade importante' : `${rel.length} atualização${rel.length>1?'ões':''}`}
                      </div>
                    </div>
                    <button onClick={() => followEvent(t)} className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center">
                      <Bell className="h-4 w-4 text-white/60" />
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* 6. UPSELL / VOCÊ ESTÁ ATUALIZADO */}
        {isFree ? (
          <section className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-900/25 via-[#0a0d16] to-[#0a0d16] p-6 md:p-10">
            <div className="max-w-2xl">
              <div className="text-xs font-bold tracking-widest text-emerald-300 uppercase mb-3">Complete seu Radar</div>
              <h2 className="font-serif-display text-3xl md:text-5xl leading-[1.05]">Você acompanha.<br /><span className="text-emerald-300">Nós acompanhamos por você.</span></h2>
              <p className="mt-4 text-white/70 text-lg">Com All Access você recebe <span className="text-white">todos os canais</span>, <span className="text-white">Em 1 Minuto ilimitado</span>, <span className="text-white">alertas avançados</span> e acesso completo à comunidade Premium.</p>
              <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {['Todos os canais', 'Em 1 Minuto', 'Enquanto Você Estava Fora', 'Alertas avançados', 'Acompanhamento inteligente', 'Comunidade Premium'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-white/80"><Check className="h-4 w-4 text-emerald-400" /> {f}</li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link href="/planos" className="radar-grad-premium text-black font-bold py-3.5 px-6 rounded-xl inline-flex items-center gap-2">
                  Liberar All Access <ArrowRight className="h-4 w-4" />
                </Link>
                <div className="text-sm text-white/60">A partir de <span className="text-white font-bold">R$ 34,90</span>/mês • cancele quando quiser</div>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-white/5 bg-white/[0.02] p-10 text-center">
            <div className="h-16 w-16 rounded-full radar-grad-premium mx-auto flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-black" strokeWidth={3} />
            </div>
            <h2 className="font-serif-display text-4xl md:text-5xl leading-tight">Você está atualizado.</h2>
            <p className="mt-3 text-white/60 max-w-md mx-auto">Não há novas atualizações importantes nos assuntos que você acompanha.</p>
          </section>
        )}

        <footer className="pt-8 pb-4 border-t border-white/5 text-sm text-white/40 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4" /> Radar Pessoal · Nós filtramos. Você fica sabendo.
          </div>
          <button onClick={() => { localStorage.removeItem('radar_user_v1'); location.reload() }} className="hover:text-white/70 text-xs">Reiniciar demo</button>
        </footer>

      </main>
    </div>
  )
}

function SectionTitle({ title, subtitle }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="font-serif-display text-3xl md:text-4xl leading-tight">{title}</h2>
        {subtitle && <p className="text-white/50 mt-1 text-sm">{subtitle}</p>}
      </div>
    </div>
  )
}

export default App
