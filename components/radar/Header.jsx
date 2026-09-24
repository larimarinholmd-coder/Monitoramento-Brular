'use client'
import Link from 'next/link'
import { Radar, Search, Bell, User, LogOut } from 'lucide-react'
import { useCurrentUser, userHasChannel, fireUserChange } from '@/lib/store/user'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { useEffect, useState } from 'react'

export function Header() {
  const { user, entitlements } = useCurrentUser()
  const [channels, setChannels] = useState([])
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    fetch('/api/channels').then(r => r.json()).then(d => setChannels(d.channels || []))
    if (user) {
      fetch('/api/notifications').then(r => r.json()).then(d => setNotifCount((d.notifications || []).filter(n => !n.readAt).length))
    }
  }, [user?.id])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    fireUserChange()
    location.href = '/'
  }

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
            {channels.map(c => {
              const locked = !userHasChannel(entitlements, c.id)
              return (
                <Link key={c.id} href="/" className={`px-3 py-2 rounded-md hover:bg-white/5 flex items-center gap-1.5 ${locked ? 'text-white/50' : 'text-white/90'}`}>
                  {c.name}
                  {locked && <span className="text-[10px]">🔒</span>}
                </Link>
              )
            })}
            <Link href="/comunidade" className="px-3 py-2 rounded-md text-white/90 hover:bg-white/5">Comunidade</Link>
          </nav>

          <div className="flex items-center gap-1">
            <button className="h-9 w-9 rounded-md hover:bg-white/5 flex items-center justify-center text-white/70"><Search className="h-4 w-4" /></button>
            <button className="h-9 w-9 rounded-md hover:bg-white/5 flex items-center justify-center text-white/70 relative">
              <Bell className="h-4 w-4" />
              {notifCount > 0 && <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-orange-500" />}
            </button>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-xs font-bold overflow-hidden">
                    {user.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : (user.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />)}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-[#0d1220] border-white/10" align="end">
                  <div className="px-2 py-2 text-xs text-white/60">
                    <div className="font-semibold text-white">{user.name}</div>
                    <div className="truncate">{user.email}</div>
                  </div>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem asChild><Link href="/planos">Meus planos</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/comunidade">Comunidade</Link></DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={logout} className="text-red-400"><LogOut className="h-4 w-4 mr-2" /> Sair</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login" className="ml-1 text-sm font-semibold bg-white text-black px-3 py-1.5 rounded-md hover:bg-white/90">Entrar</Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
