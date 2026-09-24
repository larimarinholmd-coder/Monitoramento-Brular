'use client'
import Link from 'next/link'
import { Header } from '@/components/radar/Header'
import { X } from 'lucide-react'

function ErrorPage() {
  return (
    <div className="min-h-screen bg-[#0a0d16] text-white">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-red-500/20 mx-auto flex items-center justify-center mb-6">
          <X className="h-8 w-8 text-red-400" />
        </div>
        <h1 className="font-serif-display text-4xl md:text-5xl mb-3">Não foi possível confirmar seu pagamento.</h1>
        <p className="text-white/60 mb-8">Você pode tentar novamente. Nenhum valor foi cobrado.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/planos" className="radar-grad-orange text-black font-bold py-3 px-6 rounded-lg">Tentar novamente</Link>
          <Link href="/" className="border border-white/15 px-6 py-3 rounded-lg hover:bg-white/5">Voltar para a Home</Link>
        </div>
      </main>
    </div>
  )
}
export default ErrorPage
