import { Link } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'

export function AnalyticsPage() {
  return <PageHeader title="Analytics" description="Price trends will appear here." />
}

export function AdminPage() {
  return <PageHeader title="Admin" description="Administration tools will appear here." />
}

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page not found" description="This page does not exist." />
      <Button asChild variant="outline">
        <Link to="/">Back to the home page</Link>
      </Button>
    </>
  )
}

export function ForbiddenPage() {
  return (
    <>
      <PageHeader
        title="Access denied"
        description="This area is for administrators. Your account does not have the admin role."
      />
      <Button asChild variant="outline">
        <Link to="/">Back to the home page</Link>
      </Button>
    </>
  )
}
