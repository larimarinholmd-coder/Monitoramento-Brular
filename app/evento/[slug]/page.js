'use client'
import { useEffect, useState } from 'react'
import { Header } from '@/components/radar/Header'
import { EVENTS, CHANNELS, getChannelById } from '@/lib/data/events'
import { getUser, hasAccessToChannel } from '@/lib/store/user'
import { Clock, Lock, MessageSquare, Bell, Share2, Bookmark, ArrowLeft, Check } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'

function EventPage() {
  const params = useParams()
  const slug = params?.slug
  const [user, setU] = useState(null)
  const [following, setFollowing] = useState(false)

  useEffect(() => {
    setU(getUser())
    const h = (e) => setU(e.detail)
    window.addEventListener('radar-user-change', h)
    return () => window.removeEventListener('radar-user-change', h)
  }, [])

  const event = EVENTS.find(e => e.slug === slug)
  if (!user || !event) return <div className="min-h-screen bg-[#0a0d16]" />

  const channel = getChannelById(event.channel)
  const locked = event.isPremium && !hasAccessToChannel(user, event.channel)
  const related = EVENTS.filter(e => e.channel === event.channel && e.id !== event.id).slice(0, 3)

  const toggleFollow = () => {
    setFollowing(f => !f)
    if (!following) toast.success(`Acompanhando: ${event.title}`, { description: 'Você será avisado a cada atualização importante.' })
  }

  return (
    <div className="min-h-screen bg-[#0a0d16] text-white">
      <Header />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="relative rounded-3xl overflow-hidden mb-8">
          <div className="relative aspect-[21/9]">
            <img src={event.image} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d16] via-[#0a0d16]/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-black tracking-widest uppercase" style={{color: channel?.color}}>{channel?.name}</span>
                {event.status === 'agora' && <span className="radar-pulse text-xs font-bold text-red-400">AGORA</span>}
                {event.status === 'importante' && <span className="text-xs font-bold text-orange-400 bg-orange-500/15 px-2 py-0.5 rounded">IMPORTANTE</span>}
              </div>
              <h1 className="font-serif-display text-3xl md:text-6xl leading-[1.02]">{event.title}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/60">
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Atualizado {event.updatedAt}</span>
                <span>{event.sources.length} fontes agregadas</span>
                <span className="flex items-center gap-1.5"><MessageSquare className="h-4 w-4" /> {event.communityCount} discutindo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <button onClick={toggleFollow} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition ${following ? 'radar-grad-orange text-black border-transparent' : 'border-white/15 hover:bg-white/5'}`}>
            {following ? <><Check className="h-4 w-4" /> Acompanhando</> : <><Bell className="h-4 w-4" /> Acompanhar este caso</>}
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm border border-white/15 hover:bg-white/5"><Bookmark className="h-4 w-4" /> Salvar</button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm border border-white/15 hover:bg-white/5"><Share2 className="h-4 w-4" /> Compartilhar</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
          <div>
            {/* Resumo (always visible) */}
            <section className="mb-10">
              <div className="text-xs font-bold tracking-widest text-white/40 uppercase mb-3">Resumo do acontecimento</div>
              <p className="text-lg text-white/85 leading-relaxed">{event.summary}</p>
            </section>

            {/* Full content or paywall */}
            {locked ? (
              <section className="relative rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-900/15 via-transparent to-transparent p-8 mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-black tracking-widest text-emerald-300 uppercase">Continue lendo</span>
                </div>
                <h3 className="font-serif-display text-2xl md:text-3xl mb-3">Uma nova informação mudou o cenário nesta manhã.</h3>
                <p className="text-white/60 mb-6 max-w-lg">Você está vendo apenas o resumo público deste acompanhamento.<br />Assine <span className="text-white font-semibold">{channel?.name}</span> para receber a linha do tempo completa, alertas de atualização e as próximas viradas do caso.</p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Link href="/planos" className="radar-grad-premium text-black font-bold py-3 px-6 rounded-lg">Desbloquear {channel?.name}</Link>
                  <div className="text-sm text-white/60">R$ {channel?.price.toFixed(2).replace('.', ',')}/mês • cancele quando quiser</div>
                </div>
                <div className="mt-6 pt-6 border-t border-white/10 text-xs text-white/40 space-y-1">
                  <div>🔒 {event.timeline.length + 3} atualizações disponíveis para assinantes</div>
                  <div>🔒 {event.communityCount} comentários na discussão desta notícia</div>
                  <div>🔒 {Math.floor(event.sources.length * 1.8)} alertas que poderíamos ter enviado para você neste caso</div>
                </div>
              </section>
            ) : (
              <section className="mb-10 prose prose-invert max-w-none">
                <p className="text-white/80 text-base leading-relaxed whitespace-pre-line">{event.fullContent || event.summary}</p>
              </section>
            )}

            {/* Timeline */}
            <section className="mb-10">
              <div className="text-xs font-bold tracking-widest text-white/40 uppercase mb-4">Linha do tempo</div>
              <ol className="relative border-l border-white/10 space-y-6 ml-2">
                {event.timeline.map((t, i) => (
                  <li key={i} className="pl-6 relative">
                    <span className={`absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full border-4 border-[#0a0d16] ${i === event.timeline.length -1 ? 'bg-orange-400' : 'bg-white/30'}`} />
                    <div className="text-xs font-bold text-white/40 tracking-wider">{t.time}</div>
                    <div className="text-white/90 mt-0.5">{t.title}</div>
                  </li>
                ))}
                {locked && (
                  <li className="pl-6 relative opacity-70">
                    <span className="absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-4 border-[#0a0d16]" />
                    <div className="text-xs font-bold text-emerald-300 tracking-wider flex items-center gap-1"><Lock className="h-3 w-3" /> ATUALIZAÇÃO PREMIUM</div>
                    <div className="text-white/50 mt-0.5 italic">Nova virada no caso — disponível para assinantes de {channel?.name}.</div>
                  </li>
                )}
              </ol>
            </section>

            {/* Community */}
            <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 mb-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs font-bold tracking-widest text-white/40 uppercase mb-1">Comunidade</div>
                  <div className="text-lg font-semibold">{event.communityCount} comentários • {event.communityLive} discutindo agora</div>
                </div>
                {locked ? (
                  <Link href="/planos" className="radar-grad-premium text-black text-sm font-bold px-4 py-2 rounded-lg">Desbloquear</Link>
                ) : (
                  <button className="border border-white/15 hover:bg-white/5 text-sm font-semibold px-4 py-2 rounded-lg">Entrar na discussão</button>
                )}
              </div>
              {locked && (
                <div className="text-sm text-white/60">
                  🔒 Discussão exclusiva para assinantes.<br />
                  <span className="text-white/40">{event.communityCount} pessoas já estão comentando este acontecimento.</span>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div>
              <div className="text-xs font-bold tracking-widest text-white/40 uppercase mb-3">Fontes agregadas</div>
              <ul className="space-y-2">
                {event.sources.map(s => (
                  <li key={s.name} className="flex items-center justify-between text-sm border border-white/5 rounded-lg p-3 bg-white/[0.02]">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-xs text-white/40">{s.time}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold tracking-widest text-white/40 uppercase mb-3">Assuntos</div>
              <div className="flex flex-wrap gap-2">
                {event.topics.map(t => (
                  <span key={t} className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1">{t}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold tracking-widest text-white/40 uppercase mb-3">Relacionados</div>
              <div className="space-y-3">
                {related.map(r => (
                  <Link key={r.id} href={`/evento/${r.slug}`} className="block text-sm hover:text-orange-300">
                    {r.title}
                    <div className="text-xs text-white/40 mt-0.5">{r.updatedAt}</div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

export default EventPage
