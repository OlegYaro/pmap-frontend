import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { ForbiddenPage } from '../app/pages'
import { useAuth } from './useAuth'

export const ADMIN_LOGIN_REASON = 'Admin area, please log in'

/**
 * Layout route for the /admin area. Only hides UI: the gateway refuses non-admin requests anyway.
 */
export function RequireAdmin() {
  const { status, isAdmin, openLoginDialog } = useAuth()

  useEffect(() => {
    if (status === 'anonymous') openLoginDialog(ADMIN_LOGIN_REASON)
  }, [status, openLoginDialog])

  if (status === 'loading') return <PageSkeleton />
  if (status === 'anonymous') return <Navigate to="/" replace />
  if (!isAdmin) return <ForbiddenPage />
  return <Outlet />
}

function PageSkeleton() {
  return (
    <div>
      <span role="status" className="sr-only">
        Loading
      </span>
      <div className="space-y-4" aria-hidden>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  )
}
