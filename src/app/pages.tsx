import { Link } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from './useDocumentTitle'

const backHome = (
  <Button asChild variant="outline">
    <Link to="/">Back to the home page</Link>
  </Button>
)

export function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <>
      <PageHeader title="Page not found" />
      <EmptyState message="This page does not exist." action={backHome} />
    </>
  )
}

export function ForbiddenPage() {
  useDocumentTitle('Access denied')
  return (
    <>
      <PageHeader title="Access denied" />
      <EmptyState
        message="This area is for administrators."
        description="Your account does not have the admin role."
        action={backHome}
      />
    </>
  )
}
