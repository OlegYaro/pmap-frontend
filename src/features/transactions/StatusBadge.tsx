import { Badge } from '@/components/ui/badge'
import { statusOf } from './cells'
import type { TransactionRow } from './listQuery'

/** "Clean" or the exclusion reason; excluded rows get a quieter outline badge. */
export function StatusBadge({ row }: { row: Pick<TransactionRow, 'exclusion_reason'> }) {
  const status = statusOf(row)
  return (
    <Badge
      data-status={status.kind}
      variant={status.kind === 'clean' ? 'secondary' : 'outline'}
      className={status.kind === 'excluded' ? 'text-muted-foreground' : undefined}
    >
      {status.label}
    </Badge>
  )
}
