import { RefreshCwIcon } from 'lucide-react'
import { useId } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RunDetail } from './RunDetail'
import { RunsTable, RunsTableSkeleton } from './RunsTable'
import { StartRun } from './StartRun'
import { parseLimit, RUN_LIMITS, useAdminParams } from './useAdminParams'
import { hasUnfinishedRun, useRuns } from './useRuns'

/** The runs tab: start a sync, the latest runs and the detail of the selected one. */
export function RunsTab() {
  const id = useId()
  const { limit, setLimit, runId, selectRun } = useAdminParams()
  const runs = useRuns(limit)
  const selected = runs.data?.find((run) => run.run_id === runId)

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <StartRun blocked={hasUnfinishedRun(runs.data)} />
        <div className="flex items-end gap-2">
          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-limit`}>Show</Label>
            <Select value={String(limit)} onValueChange={(value) => setLimit(parseLimit(value))}>
              <SelectTrigger id={`${id}-limit`} className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RUN_LIMITS.map((choice) => (
                  <SelectItem key={choice} value={String(choice)}>
                    {choice}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" variant="outline" onClick={() => void runs.refetch()}>
            <RefreshCwIcon aria-hidden />
            Refresh
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3" aria-labelledby={`${id}-runs`}>
        <h2 id={`${id}-runs`} className="text-lg font-semibold">
          Recent runs
        </h2>
        {runs.isError && (
          <ErrorState
            message={`Could not load the runs: ${runs.error.message}`}
            onRetry={() => void runs.refetch()}
            retrying={runs.isFetching}
          />
        )}
        {runs.data === undefined ? (
          !runs.isError && <RunsTableSkeleton />
        ) : runs.data.length === 0 ? (
          <EmptyState message="No runs yet" />
        ) : (
          <RunsTable runs={runs.data} selectedId={runId} onSelect={selectRun} />
        )}
      </section>

      <section className="grid grid-cols-1 gap-3" aria-labelledby={`${id}-detail`}>
        <h2 id={`${id}-detail`} className="text-lg font-semibold">
          Run details
        </h2>
        <RunDetail runId={runId} running={selected?.finished_at === null} />
      </section>
    </div>
  )
}
