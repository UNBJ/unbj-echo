'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { LayoutList, LogOut, BarChart2, Settings, Building2, Users, ScanLine, Vote } from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { href: '/stats', label: 'Estadísticas', icon: BarChart2 },
  { href: '/registros', label: 'Registros', icon: LayoutList },
  { href: '/checkin', label: 'Check-in', icon: ScanLine },
  
  
  { href: '/votaciones', label: 'Votaciones', icon: Vote },
  
  { href: '/config', label: 'Configuración', icon: Settings },
  { href: '/admins', label: 'Administradores', icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user } = useAuth()

  async function handleLogout() {
    await logout()
    router.replace('/login')
  }

  return (
    <aside className="w-56 bg-bg-sidebar flex flex-col h-full shrink-0">
      <div className="px-5 py-5 border-b border-white/10">
        <p className="text-white font-bold text-sm leading-tight">E2E Test Platform</p>
        <p className="text-text-on-dark text-xs mt-0.5">Panel Admin</p>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-accent text-white'
                  : 'text-text-on-dark hover:bg-bg-sidebar-hover hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <p className="text-xs text-text-on-dark truncate px-3 mb-2">{user?.email}</p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-on-dark hover:bg-bg-sidebar-hover hover:text-white transition-colors w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
