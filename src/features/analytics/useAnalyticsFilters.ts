import { useEffect } from 'react'
import { FILTER_FIELDS, type FilterField, type TransactionFilters } from '../filters/model'
import { sameFilters } from '../filters/params'
import { useFilters } from '../filters/useFilters'
import { completePeriod, today } from './period'

/** Filter keys the analytics endpoints do not take from the UI; the page drops them from the URL. */
export const ANALYTICS_DROPPED_KEYS = ['exclusion_reason', 'address', 'run_id'] as const

export type AnalyticsDroppedKey = (typeof ANALYTICS_DROPPED_KEYS)[number]

/** Filter panel fields of the analytics page: all but "Rows" and "Address". */
export const ANALYTICS_FIELDS: readonly FilterField[] = FILTER_FIELDS.filter(
  (field) => field !== 'rows' && field !== 'address',
)

/** The function set on a visit without any filters, so garages and offices do not skew the median. */
export const DEFAULT_FUNCTION = 'mieszkalna'

/**
 * The filters the analytics page writes into the URL: the period completed, the dropped keys
 * removed and, only when there were no filters at all, the default function.
 */
export function normalizeAnalyticsFilters(
  filters: TransactionFilters,
  todayDate: string,
): TransactionFilters {
  const normalized: TransactionFilters = { ...filters, ...completePeriod(filters, todayDate) }
  for (const key of ANALYTICS_DROPPED_KEYS) delete normalized[key]
  if (Object.keys(filters).length === 0) normalized.function = DEFAULT_FUNCTION
  return normalized
}

/**
 * The URL filters of the analytics page. While the URL is not normalised (period missing, a
 * dropped key present, or no filters at all) an effect rewrites it once, replacing the history
 * entry, and `ready` is false so nothing incomplete is requested.
 */
export function useAnalyticsFilters() {
  const { filters, setFilters } = useFilters()
  const todayDate = today()
  const normalized = normalizeAnalyticsFilters(filters, todayDate)
  const ready = sameFilters(normalized, filters)

  useEffect(() => {
    if (!ready) setFilters(normalized, { history: 'replace' })
  }, [ready, normalized, setFilters])

  return { filters, ready }
}
