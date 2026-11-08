import { TriangleAlertIcon } from 'lucide-react'
import { TableSkeleton } from '@/components/TableSkeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime, formatNumber, shortId } from '@/lib/format'
import { cn } from '@/lib/utils'
import { TRIGGER_LABELS, type RunListItem } from '../../api/admin-types'
import { labelFor } from '../filters/labels'
import { RunProgress } from './RunProgress'

const RUN_COLUMNS = [
  'Run',
  'Trigger',
  'Started',
  'Finished',
  'Progress',
  'Not published',
  'Failed',
] as const

interface RunsTableProps {
  runs: readonly RunListItem[]
  selectedId: string | null
  onSelect: (runId: string) => void
}

/** The loading placeholder of the runs table. */
export function RunsTableSkeleton() {
  return <TableSkeleton rows={5} columns={RUN_COLUMNS.length} />
}

/** The runs in the server's order; each run id is a button that selects the run. */
export function RunsTable({ runs, selectedId, onSelect }: RunsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {RUN_COLUMNS.map((column) => (
              <TableHead
                key={column}
                className={cn((column === 'Not published' || column === 'Failed') && 'text-right')}
              >
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => {
            const short = shortId(run.run_id)
            const selected = run.run_id === selectedId
            return (
              <TableRow
                key={run.run_id}
                aria-current={selected ? 'true' : undefined}
                data-state={selected ? 'selected' : undefined}
              >
                <TableCell title={run.run_id}>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    aria-label={`Details for run ${short}`}
                    className="h-auto px-0 font-mono"
                    onClick={() => onSelect(run.run_id)}
                  >
                    {short}
                  </Button>
                </TableCell>
                <TableCell>{labelFor(TRIGGER_LABELS, run.trigger)}</TableCell>
                <TableCell>{formatDateTime(run.started_at)}</TableCell>
                <TableCell>
                  {run.finished_at === null ? (
                    <Badge variant="secondary">Running</Badge>
                  ) : (
                    formatDateTime(run.finished_at)
                  )}
                </TableCell>
                <TableCell>
                  <RunProgress
                    done={run.done}
                    total={run.total}
                    label={`Progress of run ${short}`}
                  />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(run.not_published)}
                </TableCell>
                <FailedCell failed={run.failed} />
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

/** The failed count; above 0 it is in the destructive colour with a warning icon. */
function FailedCell({ failed }: { failed: number }) {
  const problem = failed > 0
  return (
    <TableCell
      data-problem={problem || undefined}
      className={cn('text-right tabular-nums', problem && 'text-destructive font-medium')}
    >
      <span className="inline-flex items-center gap-1">
        {problem && <TriangleAlertIcon className="size-4" aria-hidden />}
        {formatNumber(failed)}
      </span>
    </TableCell>
  )
}
