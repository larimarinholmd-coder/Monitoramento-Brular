'use client'
import { useEffect, useState } from 'react'
import { Heart, MessageCircle, Flag, Send, Lock, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export function CommentThread({ eventSlug, locked, channelName, user }) {
  const [comments, setComments] = useState([])
  const [count, setCount] = useState(0)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const r = await fetch(`/api/events/${eventSlug}/comments`)
    const d = await r.json()
    setComments(d.comments || [])
    setCount(d.count || 0)
    setLoading(false)
  }
  useEffect(() => { load() }, [eventSlug])

  const submit = async () => {
    if (!text.trim()) return
    setPosting(true)
    const r = await fetch(`/api/events/${eventSlug}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, parentId: replyTo }),
    })
    const d = await r.json()
    setPosting(false)
    if (r.ok) {
      setText(''); setReplyTo(null)
      toast.success('Comentário publicado')
      load()
    } else {
      toast.error(d.error === 'premium_required' ? 'Você precisa assinar este canal para comentar' : 'Não foi possível comentar')
    }
  }

  const like = async (id) => {
    if (!user) { toast.error('Faça login para curtir'); return }
    const r = await fetch(`/api/comments/${id}/like`, { method: 'POST' })
    if (r.ok) load()
  }
  const report = async (id) => {
    if (!user) { toast.error('Faça login'); return }
    await fetch(`/api/comments/${id}/report`, { method: 'POST' })
    toast.success('Denunciado. Nossa moderação vai revisar.')
  }

  return (
    <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 mb-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs font-bold tracking-widest text-white/40 uppercase mb-1">Comunidade</div>
          <div className="text-lg font-semibold">{count} comentários</div>
        </div>
      </div>

      {/* Compose */}
      {locked ? (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] p-5 text-center">
          <Lock className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
          <div className="font-semibold mb-1">Discussão exclusiva para assinantes</div>
          <div className="text-sm text-white/60 mb-4">{count} pessoas já estão comentando. Assine {channelName} para participar.</div>
          <Link href="/planos" className="radar-grad-premium text-black text-sm font-bold px-5 py-2.5 rounded-lg inline-block">Desbloquear {channelName}</Link>
        </div>
      ) : !user ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 text-center">
          <LogIn className="h-6 w-6 text-white/40 mx-auto mb-2" />
          <div className="font-semibold mb-1">Entre para comentar</div>
          <Link href="/login" className="mt-3 bg-white text-black text-sm font-bold px-5 py-2.5 rounded-lg inline-block">Fazer login</Link>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          {replyTo && (
            <div className="text-xs text-white/50 mb-2">Respondendo... <button onClick={() => setReplyTo(null)} className="text-orange-300 hover:underline">cancelar</button></div>
          )}
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="O que você pensa sobre isso?"
            className="w-full bg-transparent text-sm focus:outline-none resize-none" rows={2} maxLength={1000} />
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-white/40">{text.length}/1000</div>
            <button onClick={submit} disabled={posting || !text.trim()} className="radar-grad-orange text-black font-bold text-xs px-4 py-2 rounded-lg disabled:opacity-40 inline-flex items-center gap-1.5">
              <Send className="h-3 w-3" /> Publicar
            </button>
          </div>
        </div>
      )}

      {/* Comments list */}
      <div className="mt-6 space-y-4">
        {loading && <div className="text-sm text-white/40 text-center py-4">Carregando...</div>}
        {!loading && comments.length === 0 && !locked && <div className="text-sm text-white/40 text-center py-6">Seja o primeiro a comentar este acontecimento.</div>}
        {comments.map(c => (
          <div key={c.id} className="border-l-2 border-white/10 pl-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                {c.userAvatar ? <img src={c.userAvatar} alt="" className="h-full w-full object-cover" /> : c.userName?.charAt(0)?.toUpperCase()}
              </div>
              <span className="font-semibold text-sm">{c.userName}</span>
              <span className="text-xs text-white/40">• {new Date(c.createdAt).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p className="text-sm text-white/85 whitespace-pre-wrap">{c.text}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
              <button onClick={() => like(c.id)} className={`inline-flex items-center gap-1 hover:text-red-400 ${(c.likes||[]).includes(user?.id) ? 'text-red-400' : ''}`}>
                <Heart className="h-3 w-3" fill={(c.likes||[]).includes(user?.id) ? 'currentColor' : 'none'} /> {c.likes?.length || 0}
              </button>
              {user && !locked && <button onClick={() => setReplyTo(c.id)} className="inline-flex items-center gap-1 hover:text-white"><MessageCircle className="h-3 w-3" /> Responder</button>}
              <button onClick={() => report(c.id)} className="inline-flex items-center gap-1 hover:text-orange-300"><Flag className="h-3 w-3" /></button>
            </div>
            {c.replies?.length > 0 && (
              <div className="mt-3 space-y-3 ml-4">
                {c.replies.map(r => (
                  <div key={r.id} className="border-l border-white/5 pl-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold">{r.userName?.charAt(0)}</div>
                      <span className="text-xs font-semibold">{r.userName}</span>
                    </div>
                    <p className="text-xs text-white/75">{r.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
