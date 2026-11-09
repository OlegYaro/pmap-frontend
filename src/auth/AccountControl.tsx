import { LogInIcon, LogOutIcon, UserIcon } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from './useAuth'

/** The header's login control: "Log in" for anonymous users, a user menu once logged in. */
export function AccountControl() {
  const { status, user, openLoginDialog, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  // Leave the admin area first, so its guard never sees an anonymous user and offers a login.
  async function logOut() {
    if (pathname === '/admin' || pathname.startsWith('/admin/')) await navigate('/')
    await logout()
  }

  if (status === 'loading') return <Skeleton className="h-8 w-20" aria-hidden />

  if (status === 'anonymous' || !user) {
    return (
      <Button variant="outline" size="sm" onClick={() => openLoginDialog()}>
        <LogInIcon aria-hidden />
        <span className="sr-only sm:not-sr-only">Log in</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="max-w-40">
          <UserIcon aria-hidden />
          <span className="sr-only sm:not-sr-only sm:truncate">{user.login}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span className="truncate">{user.login}</span>
          {user.role && <Badge variant="secondary">{user.role}</Badge>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void logOut()}>
          <LogOutIcon aria-hidden />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
