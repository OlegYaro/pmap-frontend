import type { TransactionFilters } from '../filters/model'

/** A required analytics period: both ends as `YYYY-MM-DD`. */
export interface Period {
  date_from: string
  date_to: string
}

/** The quick period choices, in display order. */
export const PERIOD_PRESETS = [
  { label: '3 months', months: 3 },
  { label: '6 months', months: 6 },
  { label: '12 months', months: 12 },
  { label: '3 years', months: 36 },
] as const

export type PresetMonths = (typeof PERIOD_PRESETS)[number]['months']

/** Length of the period set when the URL has none. */
export const DEFAULT_PERIOD_MONTHS = 12

const pad = (value: number, length = 2) => String(value).padStart(length, '0')

function isoDate(year: number, month: number, day: number): string {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`
}

/** Today's calendar date in the user's time zone as `YYYY-MM-DD`; tests set it with `vi.setSystemTime`. */
export function today(): string {
  const now = new Date()
  return isoDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

/**
 * The same calendar day `months` before `date` (`YYYY-MM-DD`), clamped to the length of the target
 * month: 2026-08-31 minus 6 months is 2026-02-28. Computed in UTC, so the zone never shifts it.
 */
export function monthsBefore(date: string, months: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const index = year * 12 + (month - 1) - months
  const targetYear = Math.floor(index / 12)
  const targetMonth = index - targetYear * 12 + 1
  // Day 0 of the next month is the last day of the target month.
  const lastDay = new Date(0)
  lastDay.setUTCFullYear(targetYear, targetMonth, 0)
  return isoDate(targetYear, targetMonth, Math.min(day, lastDay.getUTCDate()))
}

/** The period of a preset: `months` back from `todayDate` up to `todayDate`. */
export function periodPreset(todayDate: string, months: number): Period {
  return { date_from: monthsBefore(todayDate, months), date_to: todayDate }
}

/** The period of a visit without one: the last 12 months ending today. */
export function defaultPeriod(todayDate: string): Period {
  return periodPreset(todayDate, DEFAULT_PERIOD_MONTHS)
}

/**
 * Completes a period with one end missing: `date_to` becomes today and `date_from` 12 months
 * before `date_to`. A complete period is returned as it is.
 */
export function completePeriod(filters: TransactionFilters, todayDate: string): Period {
  const dateTo = filters.date_to ?? todayDate
  return {
    date_from: filters.date_from ?? monthsBefore(dateTo, DEFAULT_PERIOD_MONTHS),
    date_to: dateTo,
  }
}

/** The preset whose period equals the filters' period today, or `'custom'` when none does. */
export function matchPreset(
  filters: TransactionFilters,
  todayDate: string = today(),
): PresetMonths | 'custom' {
  const preset = PERIOD_PRESETS.find(({ months }) => {
    const period = periodPreset(todayDate, months)
    return period.date_from === filters.date_from && period.date_to === filters.date_to
  })
  return preset ? preset.months : 'custom'
}
