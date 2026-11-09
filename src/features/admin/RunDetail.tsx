import { useId } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime, formatNumber, orEmpty } from '@/lib/format'
import { STAGE_LABELS, type RunStatus } from '../../api/admin-types'
import { ApiError } from '../../api/errors'
import { EXCLUSION_REASON_LABELS, labelFor } from '../filters/labels'
import { FailedTasks } from './FailedTasks'
import { useRun } from './useRun'

interface RunDetailProps {
  runId: string | null
  /** True while the run has no finish time in the runs list: the detail is refreshed every 5 s. */
  running: boolean
}

/** The detail panel of the selected run, with its loading, error and not-found states. */
export function RunDetail({ runId, running }: RunDetailProps) {
  const query = useRun(runId, running)

  if (runId === null) {
    return <EmptyState message="Select a run to see its details" />
  }
  if (query.error instanceof ApiError && query.error.status === 404) {
    return <EmptyState message="Run not found" description={`There is no run ${runId}.`} />
  }
  if (query.data === undefined) {
    if (query.isError) {
      return (
        <ErrorState
          message={`Could not load the run: ${query.error.message}`}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      )
    }
    return <DetailSkeleton />
  }
  return (
    <div className="grid grid-cols-1 gap-4">
      {query.isError && (
        <ErrorState
          message={`Could not refresh the run: ${query.error.message}`}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      )}
      <RunStatusView run={query.data} />
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div>
      <span role="status" className="sr-only">
        Loading
      </span>
      <div className="grid gap-3" aria-hidden>
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}

type CounterKey =
  | 'total'
  | 'downloaded'
  | 'assigned'
  | 'cleaned'
  | 'loaded'
  | 'not_published'
  | 'failed'
  | 'in_progress'
  | 'inserted'
  | 'updated'

/** Counters of a run's stages and the rows it wrote. */
const COUNTERS: readonly { key: CounterKey; label: string }[] = [
  { key: 'total', label: 'Total' },
  { key: 'downloaded', label: 'Downloaded' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'cleaned', label: 'Cleaned' },
  { key: 'loaded', label: 'Loaded' },
  { key: 'not_published', label: 'Not published' },
  { key: 'failed', label: 'Failed' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'inserted', label: 'Inserted' },
  { key: 'updated', label: 'Updated' },
]

function RunStatusView({ run }: { run: RunStatus }) {
  const id = useId()
  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="grid gap-1 text-sm">
        <p className="font-mono break-all">{run.run_id}</p>
        <p className="text-muted-foreground">
          Started {orEmpty(run.started_at, formatDateTime)}
          {run.current_stage !== null && (
            <>
              {' · '}Current stage{' '}
              <Badge variant="secondary">{labelFor(STAGE_LABELS, run.current_stage)}</Badge>
            </>
          )}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {COUNTERS.map(({ key, label }) => (
          <div key={key} className="rounded-lg border px-3 py-2">
            <dt className="text-muted-foreground text-xs">{label}</dt>
            <dd className="text-lg font-semibold tabular-nums">{formatNumber(run[key])}</dd>
          </div>
        ))}
      </dl>
      <section className="grid grid-cols-1 gap-2" aria-labelledby={`${id}-excluded`}>
        <h3 id={`${id}-excluded`} className="font-medium">
          Excluded rows
        </h3>
        <ExcludedRows excluded={run.excluded} />
      </section>
      <section className="grid grid-cols-1 gap-2" aria-labelledby={`${id}-failed`}>
        <h3 id={`${id}-failed`} className="font-medium">
          Failed tasks
        </h3>
        <FailedTasks tasks={run.failed_tasks} />
      </section>
    </div>
  )
}

/** Excluded counts by reason, largest first, labelled like the transaction statuses. */
function sortExcluded(excluded: Readonly<Record<string, number>>) {
  return Object.entries(excluded)
    .map(([reason, count]) => ({ reason, count, label: labelFor(EXCLUSION_REASON_LABELS, reason) }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

function ExcludedRows({ excluded }: { excluded: Readonly<Record<string, number>> }) {
  const rows = sortExcluded(excluded)
  if (rows.length === 0) {
    return <p className="text-muted-foreground text-sm">No rows were excluded</p>
  }
  const max = Math.max(...rows.map((row) => row.count))
  return (
    <ul className="grid gap-2">
      {rows.map(({ reason, count, label }) => (
        <li
          key={reason}
          className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto] items-center gap-3 text-sm"
        >
          <span className="truncate">{label}</span>
          <span className="bg-muted h-2 overflow-hidden rounded-full" aria-hidden>
            <span
              className="bg-primary block h-full rounded-full"
              style={{ width: `${max > 0 ? (count / max) * 100 : 0}%` }}
            />
          </span>
          <span className="text-right tabular-nums">{formatNumber(count)}</span>
        </li>
      ))}
    </ul>
  )
}
