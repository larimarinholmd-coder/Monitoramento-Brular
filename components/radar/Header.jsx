'use client'
import Link from 'next/link'
import { Radar, Search, Bell, User } from 'lucide-react'
import { CHANNELS } from '@/lib/data/events'
import { getUser, hasAccessToChannel } from '@/lib/store/user'
import { useEffect, useState } from 'react'

export function Header() {
  const [user, setU] = useState(getUser())
  useEffect(() => {
    const h = (e) => setU(e.detail)
    window.addEventListener('radar-user-change', h)
    return () => window.removeEventListener('radar-user-change', h)
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0d16]/85 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-lg radar-grad-orange flex items-center justify-center">
              <Radar className="h-4 w-4 text-black" strokeWidth={2.5} />
            </div>
            <span className="font-bold tracking-tight text-lg hidden sm:inline">Radar<span className="text-orange-400">.</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm">
            <Link href="/" className="px-3 py-2 rounded-md text-white/90 hover:bg-white/5">Início</Link>
            {CHANNELS.map(c => {
              const locked = !hasAccessToChannel(user, c.id)
              return (
                <Link key={c.id} href="/" className={`px-3 py-2 rounded-md hover:bg-white/5 flex items-center gap-1.5 ${locked ? 'text-white/50' : 'text-white/90'}`}>
                  {c.name}
                  {locked && <span className="text-[10px]">🔒</span>}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-1">
            <button className="h-9 w-9 rounded-md hover:bg-white/5 flex items-center justify-center text-white/70"><Search className="h-4 w-4" /></button>
            <button className="h-9 w-9 rounded-md hover:bg-white/5 flex items-center justify-center text-white/70 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-orange-500" />
            </button>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
