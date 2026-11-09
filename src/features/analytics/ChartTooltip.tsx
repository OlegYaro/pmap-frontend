import type { TrendLine } from './trend'

/** The box of a chart tooltip: a title and labelled values. Used only by the chart module. */
export function ChartTooltip({ title, lines }: { title: string; lines: readonly TrendLine[] }) {
  return (
    <div className="bg-popover text-popover-foreground grid gap-1 rounded-md border px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{title}</p>
      <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5">
        {lines.map((line) => (
          <div key={line.label} className="contents">
            <dt className="text-muted-foreground">{line.label}</dt>
            <dd className="text-right tabular-nums">{line.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
