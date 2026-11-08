import { formatNumber } from '@/lib/format'

interface RunProgressProps {
  done: number
  total: number
  /** Accessible name of the bar, e.g. "Progress of run 1a2b3c4d". */
  label: string
}

/** Share of a run's tasks that are done, from 0 to 100; 0 for a run without tasks. */
function progressPercent(done: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((done / total) * 100)))
}

/** `done / total` as text and a bar filled to that share. */
export function RunProgress({ done, total, label }: RunProgressProps) {
  const percent = progressPercent(done, total)
  const text = `${formatNumber(done)} / ${formatNumber(total)}`
  return (
    <div className="flex items-center gap-2">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={text}
        className="bg-muted h-2 w-24 shrink-0 overflow-hidden rounded-full"
      >
        <div className="bg-primary h-full rounded-full" style={{ width: `${percent}%` }} />
      </div>
      <span className="tabular-nums">{text}</span>
    </div>
  )
}
