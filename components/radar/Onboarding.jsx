'use client'
import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Radar, Check, ChevronRight } from 'lucide-react'
import { fireUserChange } from '@/lib/store/user'

const SUGGESTED_TOPICS = ['Flamengo', 'Palmeiras', 'Seleção', 'STF', 'Congresso', 'Reforma Tributária', 'Anitta', 'Cinema', 'União Europeia', 'Argentina', 'Energia', 'Oscar']

export function Onboarding({ open, initialName, onDone }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState(initialName || '')
  const [topics, setTopics] = useState([])
  const [saving, setSaving] = useState(false)

  const toggleTopic = (t) => setTopics(c => c.includes(t) ? c.filter(x => x !== t) : [...c, t])

  const finish = async () => {
    setSaving(true)
    await fetch('/api/user/onboarding', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name || 'Você', followedTopics: topics }),
    })
    fireUserChange()
    onDone?.()
  }

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-lg p-0 border-white/10 bg-[#0d1220] overflow-hidden [&>button.absolute]:hidden">
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
                <button onClick={() => setStep(0)} className="px-4 py-3 rounded-lg border border-white/10 text-sm text-white/70">Voltar</button>
                <button onClick={finish} disabled={saving} className="flex-1 radar-grad-orange text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? 'Ativando…' : <>Ativar meu Radar <Radar className="h-4 w-4" /></>}
                </button>
              </div>
              <p className="text-center text-xs text-white/40 mt-4">Você começa no plano Free.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
