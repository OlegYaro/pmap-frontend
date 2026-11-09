import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatNumber, formatPercent, formatPlnPerM2 } from '@/lib/format'
import type { Summary } from './useAnalyticsData'
import { changeDirection, orNotAvailable } from './values'

function ChangeValue({ change }: { change: number | null }) {
  if (change === null) return orNotAvailable(change, formatPercent)
  const direction = changeDirection(change)
  return (
    <span className="inline-flex items-center gap-1">
      {direction === 'up' && <ArrowUpIcon className="text-success size-5" aria-hidden />}
      {direction === 'down' && <ArrowDownIcon className="text-destructive size-5" aria-hidden />}
      {formatPercent(change)}
      {direction !== 'none' && <span className="sr-only">{direction}</span>}
    </span>
  )
}

/** The four headline figures of the summary, in a fixed order; missing values read "n/a". */
export function KpiCards({ summary }: { summary: Summary }) {
  const cards: { title: string; value: ReactNode }[] = [
    { title: 'Median price per m²', value: orNotAvailable(summary.median, formatPlnPerM2) },
    { title: 'Transactions', value: formatNumber(summary.count) },
    { title: 'Change vs year earlier', value: <ChangeValue change={summary.change_pct} /> },
    {
      title: 'Previous-year median',
      value: orNotAvailable(summary.previous_median, formatPlnPerM2),
    },
  ]
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.title} data-kpi className="grid min-w-0 gap-1 rounded-md border p-3">
          <dt className="text-muted-foreground text-sm">{card.title}</dt>
          <dd className="text-2xl font-semibold">{card.value}</dd>
        </div>
      ))}
    </dl>
  )
}
