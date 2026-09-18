'use client'
import { useEffect, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Zap, X, ChevronRight, Lock } from 'lucide-react'
import { getChannelById } from '@/lib/data/events'
import Link from 'next/link'
import { hasAccessToChannel } from '@/lib/store/user'

export function OneMinute({ open, onOpenChange, events, user }) {
  const [idx, setIdx] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!open) { setIdx(0); setProgress(0); return }
    const total = 12000 // 12s per item, mock
    const start = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      const p = Math.min(100, (elapsed / total) * 100)
      setProgress(p)
      if (p >= 100) {
        clearInterval(timer)
        if (idx < events.length - 1) setTimeout(() => setIdx(i => i + 1), 200)
      }
    }, 60)
    return () => clearInterval(timer)
  }, [open, idx, events.length])

  useEffect(() => { setProgress(0) }, [idx])

  if (!events?.length) return null
  const ev = events[idx]
  const channel = getChannelById(ev.channel)
  const locked = ev.isPremium && !hasAccessToChannel(user, ev.channel)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden border-white/10 bg-[#0d1220]">
        <div className="relative">
          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-3">
            {events.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full bg-white/15 overflow-hidden">
                <div className="h-full bg-orange-400 transition-all" style={{width: i < idx ? '100%' : i === idx ? `${progress}%` : '0%'}} />
              </div>
            ))}
          </div>
          <button onClick={() => onOpenChange(false)} className="absolute top-4 right-4 z-20 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>

          <div className="relative aspect-[16/10] overflow-hidden">
            <img src={ev.image} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1220] via-[#0d1220]/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-full radar-grad-orange flex items-center justify-center">
                  <Zap className="h-3.5 w-3.5 text-black" fill="currentColor" />
                </div>
                <span className="text-[10px] font-black tracking-widest uppercase" style={{color: channel?.color}}>{channel?.name}</span>
                <span className="text-[10px] text-white/50">• {String(idx+1).padStart(2, '0')} de {String(events.length).padStart(2, '0')}</span>
              </div>
              <h2 className="font-serif-display text-2xl md:text-3xl leading-tight">{ev.title}</h2>
            </div>
          </div>

          <div className="p-6 pt-4">
            <p className="text-white/80 leading-relaxed text-[15px]">{ev.summary}</p>
            {locked ? (
              <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-center gap-3">
                <Lock className="h-4 w-4 text-emerald-400 shrink-0" />
                <div className="flex-1 text-sm text-emerald-100/90">Continuação exclusiva para assinantes de {channel?.name}.</div>
                <Link href="/planos" className="text-xs font-bold px-3 py-1.5 rounded radar-grad-premium text-black" onClick={() => onOpenChange(false)}>DESBLOQUEAR</Link>
              </div>
            ) : (
              <Link href={`/evento/${ev.slug}`} onClick={() => onOpenChange(false)} className="mt-4 inline-flex items-center gap-1 text-orange-300 hover:text-orange-200 text-sm font-semibold">
                Entender melhor <ChevronRight className="h-4 w-4" />
              </Link>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} className="text-sm text-white/50 hover:text-white/80 disabled:opacity-30">← Anterior</button>
              <button onClick={() => setIdx(i => Math.min(events.length - 1, i + 1))} disabled={idx === events.length - 1} className="text-sm text-white/50 hover:text-white/80 disabled:opacity-30">Próximo →</button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
