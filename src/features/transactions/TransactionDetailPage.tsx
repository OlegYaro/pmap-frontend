import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EMPTY } from '@/lib/format'
import { ApiError } from '../../api/errors'
import { useTerritoryOptions } from '../filters/useTerritoryOptions'
import { SourceAttributes, TransactionFields } from './TransactionFields'
import { StatusBadge } from './StatusBadge'
import { parseTransactionId, useTransaction } from './useTransaction'

/** The page of one transaction: all its fields, the status and the raw source attributes. */
export function TransactionDetailPage() {
  const { id: rawId } = useParams()
  const id = parseTransactionId(rawId)
  const query = useTransaction(id)
  const { nameOf } = useTerritoryOptions()
  const location = useLocation()
  const navigate = useNavigate()

  // `key` is "default" for the first entry of the session: there is no list to go back to.
  const back =
    location.key === 'default' ? (
      <Button asChild variant="outline">
        <Link to="/">Back to the list</Link>
      </Button>
    ) : (
      <Button type="button" variant="outline" onClick={() => void navigate(-1)}>
        Back to the list
      </Button>
    )

  const title = id === null ? 'Transaction' : `Transaction ${id}`

  if (id === null || (query.error instanceof ApiError && query.error.status === 404)) {
    return (
      <>
        <PageHeader title={title} actions={back} />
        <EmptyState
          message="Transaction not found"
          action={
            <Button asChild variant="outline">
              <Link to="/">Go to the transactions</Link>
            </Button>
          }
        />
      </>
    )
  }

  if (query.isError) {
    return (
      <>
        <PageHeader title={title} actions={back} />
        <ErrorState
          message={`Could not load the transaction: ${query.error.message}`}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      </>
    )
  }

  if (!query.data) {
    return (
      <>
        <PageHeader title={title} actions={back} />
        <div className="grid gap-4" aria-hidden>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <span role="status" className="sr-only">
          Loading
        </span>
      </>
    )
  }

  const transaction = query.data
  const manual = transaction.attributes.source === 'manual'
  return (
    <>
      <PageHeader
        title={title}
        description={transaction.address ?? EMPTY}
        actions={
          <>
            <StatusBadge row={transaction} />
            {manual && <Badge variant="outline">Manual</Badge>}
            {back}
          </>
        }
      />
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
        <TransactionFields transaction={transaction} nameOf={nameOf} />
        <SourceAttributes attributes={transaction.attributes} />
      </div>
    </>
  )
}
