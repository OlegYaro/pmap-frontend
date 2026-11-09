import { Loader2Icon } from 'lucide-react'
import { useId } from 'react'
import { LockedButton } from '@/auth/LockedButton'
import { useAuth } from '@/auth/useAuth'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { TransactionFilters } from '../filters/model'
import { useExport } from './useExport'

const ANALYTICS_HINT = 'Exports the transactions that match the current filters'

interface ExportButtonProps {
  /** The filters of the page; sort and paging are never part of them. */
  filters: TransactionFilters
  /** `analytics` adds a hint that the file holds transactions, not the aggregated figures. */
  scope?: 'transactions' | 'analytics'
  disabled?: boolean
}

/**
 * "Export CSV" for the page header: locked for anonymous users, otherwise it exports the rows
 * matching `filters` and shows its progress (spinner, "Preparing export...") until the download.
 */
export function ExportButton({ filters, scope = 'transactions', disabled }: ExportButtonProps) {
  const { status: authStatus } = useAuth()
  const { status, start, announcement } = useExport(filters)
  const hintId = useId()
  const running = status === 'running'
  const authenticated = authStatus === 'authenticated'
  const hinted = authenticated && scope === 'analytics'

  const button = (
    <LockedButton
      action="export"
      className="min-w-44"
      disabled={authenticated && (running || disabled === true)}
      aria-describedby={hinted ? hintId : undefined}
      onClick={start}
    >
      {running ? (
        <>
          <Loader2Icon aria-hidden className="animate-spin motion-reduce:animate-none" />
          Preparing export...
        </>
      ) : (
        'Export CSV'
      )}
    </LockedButton>
  )

  return (
    <>
      {hinted ? (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>{ANALYTICS_HINT}</TooltipContent>
        </Tooltip>
      ) : (
        button
      )}
      {hinted && (
        <span id={hintId} className="sr-only">
          {ANALYTICS_HINT}
        </span>
      )}
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </>
  )
}
