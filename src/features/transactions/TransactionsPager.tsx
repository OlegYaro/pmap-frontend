import { Button } from '@/components/ui/button'
import { formatNumber } from '@/lib/format'
import { PAGE_SIZE } from './listQuery'

interface TransactionsPagerProps {
  /** Page number, from 1. */
  page: number
  /** Rows on the shown page. */
  count: number
  hasNext: boolean
  /** A page request is running: the buttons wait for it. */
  busy: boolean
  onFirst: () => void
  onPrevious: () => void
  onNext: () => void
}

/** The footer under the table: which rows are shown, the page number and First / Previous / Next. */
export function TransactionsPager({
  page,
  count,
  hasNext,
  busy,
  onFirst,
  onPrevious,
  onNext,
}: TransactionsPagerProps) {
  const start = (page - 1) * PAGE_SIZE + 1
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p aria-live="polite" className="text-muted-foreground text-sm">
        {count > 0 ? `Rows ${formatNumber(start)}–${formatNumber(start + count - 1)}` : 'No rows'}
        {' · '}Page {formatNumber(page)}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {page > 1 && (
          <>
            <Button type="button" variant="outline" onClick={onFirst} disabled={busy}>
              First page
            </Button>
            <Button type="button" variant="outline" onClick={onPrevious} disabled={busy}>
              Previous
            </Button>
          </>
        )}
        <Button type="button" variant="outline" onClick={onNext} disabled={busy || !hasNext}>
          Next
        </Button>
      </div>
    </div>
  )
}
