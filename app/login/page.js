'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Radar, Mail, Lock } from 'lucide-react'
import { fireUserChange } from '@/lib/store/user'
import { toast } from 'sonner'
import Link from 'next/link'

function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup'
    const r = await fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    const d = await r.json()
    setLoading(false)
    if (r.ok) {
      fireUserChange()
      toast.success(mode === 'login' ? 'Bem-vindo de volta' : 'Conta criada')
      router.push('/')
    } else {
      toast.error(d.error === 'email_exists' ? 'Este e-mail já está cadastrado' :
                   d.error === 'invalid_credentials' ? 'E-mail ou senha inválidos' :
                   d.error === 'invalid_input' ? 'Senha precisa ter no mínimo 6 caracteres' :
                   'Erro ao autenticar')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0d16] text-white flex items-center justify-center p-4">
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-orange-900/20 to-transparent pointer-events-none" />
      <div className="relative w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 mb-8 justify-center">
          <div className="h-10 w-10 rounded-xl radar-grad-orange flex items-center justify-center">
            <Radar className="h-5 w-5 text-black" strokeWidth={2.5} />
          </div>
          <span className="font-bold tracking-tight text-2xl">Radar<span className="text-orange-400">.</span></span>
        </Link>

        <h1 className="font-serif-display text-4xl md:text-5xl leading-tight text-center mb-2">
          {mode === 'login' ? 'Bem-vindo de volta' : 'Ative seu Radar'}
        </h1>
        <p className="text-center text-white/50 mb-8">
          {mode === 'login' ? 'Entre para ver o que aconteceu enquanto você estava fora.' : 'Nós filtramos. Você fica sabendo.'}
        </p>

        <a href="/api/auth/google" className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3 rounded-lg hover:bg-white/90 mb-4">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continuar com Google
        </a>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/40">ou</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'signup' && (
            <input value={name} onChange={e=>setName(e.target.value)} type="text" placeholder="Seu nome"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400/60 focus:outline-none" />
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input required value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="seu@email.com"
              className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400/60 focus:outline-none" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input required value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Senha"
              className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400/60 focus:outline-none" minLength={6} />
          </div>
          <button type="submit" disabled={loading} className="w-full radar-grad-orange text-black font-bold py-3 rounded-lg disabled:opacity-50">
            {loading ? '…' : (mode === 'login' ? 'Entrar' : 'Criar conta')}
          </button>
        </form>

        <div className="text-center text-sm text-white/50 mt-6">
          {mode === 'login' ? (
            <>Ainda não tem conta? <button onClick={()=>setMode('signup')} className="text-orange-300 hover:underline font-semibold">Cadastre-se</button></>
          ) : (
            <>Já tem conta? <button onClick={()=>setMode('login')} className="text-orange-300 hover:underline font-semibold">Entrar</button></>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginPage
