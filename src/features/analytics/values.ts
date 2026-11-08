import type { Summary } from './useAnalyticsData'

/** Shown on the analytics page in place of a value the backend could not compute. */
export const NOT_AVAILABLE = 'n/a'

/** `format(value)`, or "n/a" when the value is null or undefined (0 is formatted). */
export function orNotAvailable<T>(value: T | null | undefined, format: (value: T) => string) {
  return value === null || value === undefined ? NOT_AVAILABLE : format(value)
}

/** Direction of a change as shown: by its value rounded to one decimal, so `0.04` is no change. */
export function changeDirection(change: number): 'up' | 'down' | 'none' {
  // `toFixed` rounds half away from zero like `Intl.NumberFormat`, so arrow and text agree.
  const shown = Number(change.toFixed(1))
  if (shown > 0) return 'up'
  if (shown < 0) return 'down'
  return 'none'
}

/** No clean transaction matched: nothing to show in the cards or the distributions. */
export function isEmptySummary(summary: Summary): boolean {
  return summary.count === 0 && summary.rooms.length === 0 && summary.floors.length === 0
}
