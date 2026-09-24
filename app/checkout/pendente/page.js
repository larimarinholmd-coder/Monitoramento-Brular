'use client'
import Link from 'next/link'
import { Header } from '@/components/radar/Header'
import { Clock } from 'lucide-react'

function PendingPage() {
  return (
    <div className="min-h-screen bg-[#0a0d16] text-white">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Clock className="h-16 w-16 mx-auto mb-6 text-amber-400" />
        <h1 className="font-serif-display text-4xl md:text-5xl mb-3">Estamos aguardando a confirmação do seu pagamento.</h1>
        <p className="text-white/60 mb-8">Assim que o Mercado Pago confirmar, seu acesso será liberado automaticamente. Você receberá uma notificação.</p>
        <Link href="/" className="radar-grad-orange text-black font-bold py-3 px-6 rounded-lg inline-block">Voltar para a Home</Link>
      </main>
    </div>
  )
}
export default PendingPage
