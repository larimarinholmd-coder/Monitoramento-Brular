'use client'
import Link from 'next/link'
import { MessageSquare, Clock, Lock, Bookmark, Share2 } from 'lucide-react'
import { getChannelById } from '@/lib/data/events'

const STATUS_STYLE = {
  agora: { label: 'AGORA', class: 'bg-red-500 text-white radar-pulse' },
  importante: { label: 'IMPORTANTE', class: 'bg-orange-500 text-black' },
  desenvolvimento: { label: 'EM DESENVOLVIMENTO', class: 'bg-amber-500/90 text-black' },
  atualizacao: { label: 'ATUALIZAÇÃO', class: 'bg-white/20 text-white' },
}

export function EventCard({ event, size = 'md', locked }) {
  const channel = getChannelById(event.channel)
  const s = STATUS_STYLE[event.status]

  if (size === 'hero') {
    return (
      <Link href={`/evento/${event.slug}`} className="group relative block overflow-hidden rounded-2xl border border-white/5 bg-card">
        <div className="relative aspect-[16/9] md:aspect-[21/10] overflow-hidden">
          <img src={event.image} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className={`text-[10px] font-black tracking-wider px-2.5 py-1 rounded ${s.class}`}>{s.label}</span>
            <span className="text-[10px] font-bold tracking-widest text-white/90 uppercase" style={{color: channel?.color}}>{channel?.name}</span>
          </div>
          {locked && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded">
              <Lock className="h-3 w-3" /> PREMIUM
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
            <h2 className="font-serif-display text-3xl md:text-5xl leading-[1.05] mb-2">{event.title}</h2>
            <p className="text-white/75 text-sm md:text-base max-w-2xl line-clamp-2">{event.summary}</p>
            <div className="flex items-center gap-4 mt-4 text-xs text-white/60">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Atualizado {event.updatedAt}</span>
              <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {event.communityCount} discutindo</span>
              <span>{event.sources.length} fontes</span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  const compact = size === 'sm'
  return (
    <Link href={`/evento/${event.slug}`} className="group relative flex flex-col overflow-hidden rounded-xl border border-white/5 bg-card hover:border-white/15 transition-colors">
      <div className={`relative overflow-hidden ${compact ? 'aspect-[16/9]' : 'aspect-[16/10]'}`}>
        <img src={event.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className={`text-[9px] font-black tracking-wider px-2 py-0.5 rounded ${s.class}`}>{s.label}</span>
        </div>
        {locked && (
          <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-black/70 border border-emerald-500/60 flex items-center justify-center">
            <Lock className="h-3 w-3 text-emerald-300" />
          </div>
        )}
      </div>
      <div className={`p-4 flex-1 flex flex-col ${compact ? '' : ''}`}>
        <div className="text-[10px] font-bold tracking-widest uppercase mb-1.5" style={{color: channel?.color}}>{channel?.name}</div>
        <h3 className={`font-semibold leading-tight mb-2 ${compact ? 'text-sm' : 'text-base'} line-clamp-3`}>{event.title}</h3>
        {!compact && <p className="text-xs text-white/60 line-clamp-2 mb-3">{event.summary}</p>}
        <div className="mt-auto flex items-center justify-between text-[11px] text-white/50">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {event.updatedAt}</span>
          <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {event.communityCount}</span>
        </div>
      </div>
    </Link>
  )
}
