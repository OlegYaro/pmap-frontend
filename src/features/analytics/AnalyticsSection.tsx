import { useId, type ReactNode } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Shown by every analytics section whose data is empty. */
export const NO_DATA = 'No data for this period'

/** The part of a query result a section needs; a TanStack `useQuery` result fits it. */
export interface SectionQuery<T> {
  data: T | undefined
  isPending: boolean
  isError: boolean
  error: Error | null
  isFetching: boolean
  refetch: () => unknown
}

interface AnalyticsSectionProps {
  title: string
  /** Controls shown next to the title (a chart/table toggle). */
  actions?: ReactNode
  children: ReactNode
  className?: string
}

/** A titled region of the analytics page. */
export function AnalyticsSection({ title, actions, children, className }: AnalyticsSectionProps) {
  const titleId = useId()
  return (
    <section
      aria-labelledby={titleId}
      className={cn('bg-card grid min-w-0 content-start gap-3 rounded-lg border p-4', className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={titleId} className="text-base font-semibold">
          {title}
        </h2>
        {actions}
      </div>
      {children}
    </section>
  )
}

/** A loading placeholder of the given height class, announced as "Loading". */
export function SectionSkeleton({ className = 'h-64' }: { className?: string }) {
  return (
    <div>
      <span role="status" className="sr-only">
        Loading
      </span>
      <Skeleton aria-hidden className={cn('w-full', className)} />
    </div>
  )
}

interface QueryContentProps<T> {
  query: SectionQuery<T>
  /** What failed, for the error message: "the summary". */
  what: string
  isEmpty: (data: T) => boolean
  skeleton: ReactNode
  children: (data: T) => ReactNode
}

/**
 * The state of one section's data: the skeleton while it loads, the error with "Retry" (which
 * repeats only this query), "No data for this period" when empty, otherwise `children`.
 */
export function QueryContent<T>({
  query,
  what,
  isEmpty,
  skeleton,
  children,
}: QueryContentProps<T>) {
  if (query.isError && query.data === undefined) {
    return (
      <ErrorState
        message={`Could not load ${what}: ${query.error?.message ?? 'unknown error'}`}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    )
  }
  if (query.data === undefined) return skeleton
  if (isEmpty(query.data)) return <EmptyState message={NO_DATA} />
  return children(query.data)
}
