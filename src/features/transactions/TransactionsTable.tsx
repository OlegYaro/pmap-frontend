import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type Header,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, type KeyboardEvent } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { TRANSACTION_COLUMNS } from './columns'
import type { TransactionRow } from './listQuery'
import { isSortField, nextSort, type ListSort } from './sort'

interface TransactionsTableProps {
  rows: TransactionRow[]
  sort: ListSort
  onSortChange: (sort: ListSort) => void
  /** Opens the detail of the transaction with this id. */
  onOpen: (id: number) => void
  /** The table box scrolls back to its top when this changes (the page number). */
  scrollKey?: number
  /** The rows are the previous page while the next one loads. */
  dimmed?: boolean
}

const SORTABLE_IDS = new Set(
  TRANSACTION_COLUMNS.filter((column) => column.enableSorting !== false).map((column) => column.id),
)

/**
 * The transaction rows, sorted by the server. The header stays visible while the rows scroll inside
 * the table's own box, which also scrolls sideways on narrow screens.
 */
export function TransactionsTable({
  rows,
  sort,
  onSortChange,
  onOpen,
  scrollKey,
  dimmed,
}: TransactionsTableProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const box = boxRef.current
    if (box && typeof box.scrollTo === 'function') box.scrollTo({ top: 0 })
  }, [scrollKey])
  const sorting = useMemo<SortingState>(
    () => (SORTABLE_IDS.has(sort.field) ? [{ id: sort.field, desc: sort.order === 'desc' }] : []),
    [sort],
  )
  const table = useReactTable({
    data: rows,
    columns: TRANSACTION_COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
    manualSorting: true,
    enableSortingRemoval: false,
    state: { sorting },
  })

  const openOnEnter = (event: KeyboardEvent<HTMLTableRowElement>, id: number) => {
    if (event.key === 'Enter' && event.target === event.currentTarget) onOpen(id)
  }

  return (
    <div
      ref={boxRef}
      aria-busy={dimmed || undefined}
      className={cn(
        'max-h-[max(24rem,calc(100svh_-_12rem))] max-w-full min-w-0 overflow-auto rounded-lg border',
        dimmed && 'opacity-60',
      )}
    >
      <Table>
        <TableHeader className="bg-background sticky top-0 z-10 shadow-[inset_0_-1px_0_var(--border)]">
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="hover:bg-transparent">
              {group.headers.map((header) => (
                <HeaderCell
                  key={header.id}
                  header={header}
                  onSort={(field) => onSortChange(nextSort(sort, field))}
                />
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              tabIndex={0}
              onClick={() => onOpen(row.original.id)}
              onKeyDown={(event) => openOnEnter(event, row.original.id)}
              className="even:bg-muted/20 focus-visible:bg-muted/50 focus-visible:outline-ring cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={cn(
                    'px-2',
                    cell.column.columnDef.meta?.numeric && 'text-right tabular-nums',
                  )}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

interface HeaderCellProps {
  header: Header<TransactionRow, unknown>
  onSort: (field: ListSort['field']) => void
}

function HeaderCell({ header, onSort }: HeaderCellProps) {
  const { column } = header
  const label = flexRender(column.columnDef.header, header.getContext())
  const numeric = column.columnDef.meta?.numeric
  const field = column.getCanSort() && isSortField(column.id) ? column.id : undefined
  const sorted = column.getIsSorted()
  const Icon = sorted === 'asc' ? ArrowUpIcon : sorted === 'desc' ? ArrowDownIcon : ArrowUpDownIcon

  return (
    <TableHead
      className={cn('px-2', numeric && 'text-right')}
      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
    >
      {field ? (
        <button
          type="button"
          onClick={() => onSort(field)}
          className={cn(
            'hover:text-foreground focus-visible:ring-ring/50 -mx-1 inline-flex items-center gap-1 rounded-sm px-1 py-0.5 outline-none focus-visible:ring-[3px]',
            numeric && 'flex-row-reverse',
            !sorted && 'text-muted-foreground',
          )}
        >
          {label}
          <Icon className={cn('size-3.5', !sorted && 'opacity-50')} aria-hidden />
        </button>
      ) : (
        <span className="text-muted-foreground">{label}</span>
      )}
    </TableHead>
  )
}
