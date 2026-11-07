import { useNavigate } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { PageHeader } from '@/components/PageHeader'
import { TableSkeleton } from '@/components/TableSkeleton'
import { Button } from '@/components/ui/button'
import { ActiveFilterChips } from '../filters/ActiveFilterChips'
import { FilterPanel } from '../filters/FilterPanel'
import { useFilters } from '../filters/useFilters'
import { TRANSACTION_COLUMNS } from './columns'
import { TransactionsPager } from './TransactionsPager'
import { TransactionsTable } from './TransactionsTable'
import { useSort } from './useSort'
import { useTransactionList } from './useTransactionList'

const SKELETON_ROWS = 10

/** The home page: filters, then the transactions they select, sorted and paged by the server. */
export function TransactionsPage() {
  const { filters, resetFilters } = useFilters()
  const { sort, setSort } = useSort()
  const navigate = useNavigate()
  const list = useTransactionList(filters, sort)
  const { rows } = list
  const hasFilters = Object.keys(filters).length > 0

  const pager = (
    <TransactionsPager
      page={list.page}
      count={rows.length}
      hasNext={list.hasNext}
      busy={list.isFetching}
      onFirst={list.goFirst}
      onPrevious={list.goPrevious}
      onNext={list.goNext}
    />
  )

  let content
  if (list.isError && !list.data) {
    content = (
      <>
        <ErrorState
          message={`Could not load transactions: ${list.error.message}`}
          onRetry={() => void list.refetch()}
          retrying={list.isFetching}
        />
        {list.page > 1 && (
          <div>
            <Button type="button" variant="outline" onClick={list.goFirst}>
              First page
            </Button>
          </div>
        )}
      </>
    )
  } else if (list.isPending) {
    content = <TableSkeleton rows={SKELETON_ROWS} columns={TRANSACTION_COLUMNS.length} />
  } else if (rows.length === 0 && list.page > 1) {
    content = (
      <>
        <EmptyState message="No more rows" />
        {pager}
      </>
    )
  } else if (rows.length === 0) {
    content = (
      <EmptyState
        message="No transactions match these filters"
        action={
          hasFilters && (
            <Button type="button" variant="outline" onClick={resetFilters}>
              Reset
            </Button>
          )
        }
      />
    )
  } else {
    content = (
      <>
        <TransactionsTable
          rows={rows}
          sort={sort}
          onSortChange={setSort}
          onOpen={(id) => navigate(`/transactions/${id}`)}
          scrollKey={list.page}
          dimmed={list.isPlaceholderData}
        />
        {pager}
      </>
    )
  }

  return (
    <>
      <PageHeader title="Transactions" actions={<div data-slot="export-action" />} />
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
        <FilterPanel />
        <ActiveFilterChips />
        <section
          aria-label="Transaction list"
          className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3"
        >
          {content}
        </section>
      </div>
    </>
  )
}
