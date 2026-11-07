import { MapPinIcon } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { cn } from '@/lib/utils'
import { AccountControl } from '../auth/AccountControl'
import { useAuth } from '../auth/useAuth'

const NAV_ITEMS = [
  { to: '/', label: 'Transactions', adminOnly: false },
  { to: '/analytics', label: 'Analytics', adminOnly: false },
  { to: '/admin', label: 'Admin', adminOnly: true },
]

export function RootLayout() {
  const { isAdmin } = useAuth()
  return (
    <div className="flex min-h-svh flex-col">
      <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
          <Link to="/" aria-label="PMAP" className="flex items-center gap-2 font-semibold">
            <MapPinIcon className="size-5" aria-hidden />
            <span className="hidden sm:inline">PMAP</span>
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1">
            {NAV_ITEMS.filter((item) => isAdmin || !item.adminOnly).map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div data-slot="header-actions" className="flex items-center gap-2">
              <AccountControl />
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
