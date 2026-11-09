import { formatMonth, formatNumber, formatPlnPerM2 } from '@/lib/format'
import type { TimeseriesPoint } from './useAnalyticsData'
import { orNotAvailable } from './values'

/** One month of the price chart and its table. */
export interface TrendPoint {
  /** `YYYY-MM`, the x value. */
  month: string
  count: number
  median: number | null
  p25: number | null
  p75: number | null
  /** `[p25, p75]` when both exist; null leaves the band out for that month. */
  band: [number, number] | null
}

const MONTH_PREFIX = /^(\d{4})-(\d{2})(?:-\d{2}.*)?$/

/** `YYYY-MM` of a `YYYY-MM` or `YYYY-MM-DD…` value, or null when it does not parse. */
export function monthKey(month: string | null): string | null {
  if (month === null) return null
  const match = MONTH_PREFIX.exec(month.trim())
  if (!match) return null
  const value = Number(match[2])
  return value >= 1 && value <= 12 ? `${match[1]}-${match[2]}` : null
}

/** The chart series: points without a usable month dropped, the rest in time order. */
export function buildTrend(points: readonly TimeseriesPoint[]): TrendPoint[] {
  const trend: TrendPoint[] = []
  for (const point of points) {
    const month = monthKey(point.month)
    if (month === null) continue
    const { count, median, p25, p75 } = point
    const band: [number, number] | null = p25 !== null && p75 !== null ? [p25, p75] : null
    trend.push({ month, count, median, p25, p75, band })
  }
  return trend.sort((a, b) => a.month.localeCompare(b.month))
}

/** A labelled value of the tooltip. */
export interface TrendLine {
  label: string
  value: string
}

/** The month title of a point: "March 2025". */
export function trendMonthLabel(point: TrendPoint): string {
  return formatMonth(point.month)
}

/** The tooltip lines of a month, formatted like the KPI values. */
export function trendTooltipLines(point: TrendPoint): TrendLine[] {
  return [
    { label: 'Median', value: orNotAvailable(point.median, formatPlnPerM2) },
    { label: 'P25', value: orNotAvailable(point.p25, formatPlnPerM2) },
    { label: 'P75', value: orNotAvailable(point.p75, formatPlnPerM2) },
    { label: 'Transactions', value: formatNumber(point.count) },
  ]
}

/** The chart's accessible name: number of months and the range of the median. */
export function trendDescription(trend: readonly TrendPoint[]): string {
  const months = `${trend.length} ${trend.length === 1 ? 'month' : 'months'}`
  const medians = trend.flatMap((point) => (point.median === null ? [] : [point.median]))
  if (medians.length === 0) return `Median price per m² by month, ${months}, no median available`
  const low = formatPlnPerM2(Math.min(...medians))
  const high = formatPlnPerM2(Math.max(...medians))
  return `Median price per m² by month, ${months}, median from ${low} to ${high}`
}
