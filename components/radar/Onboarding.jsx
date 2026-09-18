'use client'
import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { CHANNELS } from '@/lib/data/events'
import { setUser } from '@/lib/store/user'
import { Radar, Check, ChevronRight } from 'lucide-react'

const SUGGESTED_TOPICS = ['Flamengo', 'Palmeiras', 'Seleção', 'STF', 'Congresso', 'Reforma Tributária', 'Anitta', 'Cinema', 'União Europeia', 'Argentina', 'Energia', 'Oscar']

export function Onboarding({ open, onDone }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [channels, setChannels] = useState([])
  const [topics, setTopics] = useState([])

  const toggleChannel = (id) => setChannels(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id])
  const toggleTopic = (t) => setTopics(c => c.includes(t) ? c.filter(x => x !== t) : [...c, t])

  const finish = () => {
    // In Phase 1: user marks free tier with 'mundo' preview always, plus tracks interests.
    // They stay Free by default — they'll see paywalls to convert.
    setUser({
      name: name || 'Você',
      hasOnboarded: true,
      subscribedChannels: [], // start as FREE
      followedTopics: topics,
      lastActiveAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6h ago for demo effect
    })
    onDone?.()
  }

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-lg p-0 border-white/10 bg-[#0d1220] overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-lg radar-grad-orange flex items-center justify-center">
              <Radar className="h-4 w-4 text-black" strokeWidth={2.5} />
            </div>
            <span className="font-bold tracking-tight text-lg">Configurar seu Radar</span>
          </div>

          {step === 0 && (
            <div>
              <h2 className="font-serif-display text-3xl leading-tight mb-2">Como podemos te chamar?</h2>
              <p className="text-white/60 text-sm mb-6">Vamos personalizar sua Home com sua leitura, seus assuntos e seu ritmo.</p>
              <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu primeiro nome"
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400/60 focus:outline-none" />
              <button onClick={() => setStep(1)} disabled={!name.trim()} className="mt-6 w-full radar-grad-orange text-black font-bold py-3 rounded-lg disabled:opacity-40 flex items-center justify-center gap-2">
                Continuar <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="font-serif-display text-3xl leading-tight mb-2">O que você não quer perder?</h2>
              <p className="text-white/60 text-sm mb-6">Escolha os canais que interessam. Você começa no Free — desbloqueia depois se quiser tudo.</p>
              <div className="grid grid-cols-2 gap-3">
                {CHANNELS.map(c => (
                  <button key={c.id} onClick={() => toggleChannel(c.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${channels.includes(c.id) ? 'border-orange-400 bg-orange-400/10' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black tracking-widest uppercase" style={{color: c.color}}>{c.name}</span>
                      {channels.includes(c.id) && <Check className="h-4 w-4 text-orange-300" />}
                    </div>
                    <p className="text-xs text-white/50">{c.tagline}</p>
                  </button>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setStep(0)} className="px-4 py-3 rounded-lg border border-white/10 text-sm text-white/70">Voltar</button>
                <button onClick={() => setStep(2)} disabled={channels.length === 0} className="flex-1 radar-grad-orange text-black font-bold py-3 rounded-lg disabled:opacity-40 flex items-center justify-center gap-2">
                  Continuar <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-serif-display text-3xl leading-tight mb-2">Quem ou o que deseja acompanhar?</h2>
              <p className="text-white/60 text-sm mb-6">Escolha assuntos, times, pessoas. Você recebe só quando algo muda.</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_TOPICS.map(t => (
                  <button key={t} onClick={() => toggleTopic(t)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${topics.includes(t) ? 'bg-white text-black border-white' : 'bg-white/[0.03] text-white/80 border-white/10 hover:border-white/30'}`}>
                    {topics.includes(t) && <Check className="inline h-3 w-3 mr-1" />}{t}
                  </button>
                ))}
              </div>
              <div className="mt-8 flex gap-3">
                <button onClick={() => setStep(1)} className="px-4 py-3 rounded-lg border border-white/10 text-sm text-white/70">Voltar</button>
                <button onClick={finish} className="flex-1 radar-grad-orange text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                  Ativar meu Radar <Radar className="h-4 w-4" />
                </button>
              </div>
              <p className="text-center text-xs text-white/40 mt-4">Você começa no plano Free. Sem cartão.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
