import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react'
import { Suspense, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  AnalyticsSection,
  QueryContent,
  SectionSkeleton,
  type SectionQuery,
} from './AnalyticsSection'
import {
  buildDistribution,
  nextSort,
  sortDistribution,
  type DistributionItem,
  type DistributionRow,
  type DistributionSort,
  type DistributionSortKey,
} from './distribution'
import { LazyDistributionChart } from './lazyCharts'
import type { Summary } from './useAnalyticsData'

const SKELETON = <SectionSkeleton className="h-56" />
const VIEWS = [
  { value: 'chart', label: 'Chart' },
  { value: 'table', label: 'Table' },
] as const

type View = (typeof VIEWS)[number]['value']

interface DistributionSectionProps {
  title: string
  /** The summary request, shared with the KPI cards. */
  query: SectionQuery<Summary>
  /** The distribution of this section: `rooms` or `floors`. */
  select: (summary: Summary) => DistributionRow[]
}

/**
 * One distribution of the summary as a bar chart or a table, with its own Chart/Table toggle.
 * The table sorts on the client; neither the toggle nor the sort is kept in the URL.
 */
export function DistributionSection({ title, query, select }: DistributionSectionProps) {
  const [view, setView] = useState<View>('chart')
  const { data } = query
  const items = useMemo(
    () => (data === undefined ? undefined : buildDistribution(select(data))),
    [data, select],
  )
  const hasItems = items !== undefined && items.length > 0

  return (
    <AnalyticsSection
      title={title}
      actions={
        hasItems && (
          <div role="group" aria-label={`${title} view`} className="flex gap-1">
            {VIEWS.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={view === option.value ? 'secondary' : 'ghost'}
                aria-pressed={view === option.value}
                onClick={() => setView(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        )
      }
    >
      <QueryContent
        query={{ ...query, data: items }}
        what="the summary"
        isEmpty={(rows: DistributionItem[]) => rows.length === 0}
        skeleton={SKELETON}
      >
        {(rows) =>
          view === 'table' ? (
            <DistributionTable title={title} items={rows} />
          ) : (
            <Suspense fallback={SKELETON}>
              <LazyDistributionChart title={title} items={rows} />
            </Suspense>
          )
        }
      </QueryContent>
    </AnalyticsSection>
  )
}

const COLUMNS: { key: DistributionSortKey; label: string; numeric: boolean }[] = [
  { key: 'group', label: 'Group', numeric: false },
  { key: 'count', label: 'Transactions', numeric: true },
]

/** The distribution as a table whose headers sort it: ascending first, then they alternate. */
function DistributionTable({ title, items }: { title: string; items: DistributionItem[] }) {
  const [sort, setSort] = useState<DistributionSort | null>(null)
  const rows = useMemo(() => sortDistribution(items, sort), [items, sort])

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <caption className="sr-only">Transactions {title.toLowerCase()}</caption>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((column) => {
              const direction = sort?.key === column.key ? sort.direction : undefined
              const Icon =
                direction === 'asc'
                  ? ArrowUpIcon
                  : direction === 'desc'
                    ? ArrowDownIcon
                    : ArrowUpDownIcon
              return (
                <TableHead
                  key={column.key}
                  className={cn(column.numeric && 'text-right')}
                  aria-sort={
                    direction === 'asc'
                      ? 'ascending'
                      : direction === 'desc'
                        ? 'descending'
                        : undefined
                  }
                >
                  <button
                    type="button"
                    onClick={() => setSort(nextSort(sort, column.key))}
                    className={cn(
                      'hover:text-foreground focus-visible:ring-ring/50 -mx-1 inline-flex items-center gap-1 rounded-sm px-1 py-0.5 outline-none focus-visible:ring-[3px]',
                      column.numeric && 'flex-row-reverse',
                      !direction && 'text-muted-foreground',
                    )}
                  >
                    {column.label}
                    <Icon className={cn('size-3.5', !direction && 'opacity-50')} aria-hidden />
                  </button>
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((item) => (
            <TableRow key={`${item.unknown}-${item.group}`}>
              <TableCell>{item.group}</TableCell>
              <TableCell className="text-right tabular-nums">{formatNumber(item.count)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
