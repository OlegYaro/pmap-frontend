import { skipToken, useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import type { components } from '../../api/schema'
import type { TransactionFilters } from '../filters/model'
import { serializeFilters } from '../filters/params'
import { ANALYTICS_DROPPED_KEYS, type AnalyticsDroppedKey } from './useAnalyticsFilters'

export type Summary = components['schemas']['SummaryResponse']
export type TimeseriesPoint = components['schemas']['TimeseriesPoint']

/**
 * The query of both analytics endpoints: the filters with a required period and without the keys
 * the endpoints do not take. Its type has no `sort`, `limit` or paging keys, so they cannot be sent.
 */
export type AnalyticsQuery = Omit<
  TransactionFilters,
  AnalyticsDroppedKey | 'date_from' | 'date_to'
> & {
  date_from: string
  date_to: string
}

/** The analytics query of `filters`, or null while the period is incomplete. */
export function buildAnalyticsQuery(filters: TransactionFilters): AnalyticsQuery | null {
  const { date_from: dateFrom, date_to: dateTo } = filters
  if (dateFrom === undefined || dateTo === undefined) return null
  const query: TransactionFilters = { ...filters }
  for (const key of ANALYTICS_DROPPED_KEYS) delete query[key]
  return { ...query, date_from: dateFrom, date_to: dateTo }
}

/** Query key of an analytics endpoint: equal filters (in any order) share one cache entry. */
export function analyticsQueryKey(
  endpoint: 'summary' | 'timeseries',
  query: AnalyticsQuery | null,
) {
  return [
    'analytics',
    endpoint,
    query === null ? null : serializeFilters(query).toString(),
  ] as const
}

const QUERY_OPTIONS = { staleTime: 5 * 60_000, refetchOnWindowFocus: false } as const

/** The analytics query, or null when the page is not ready to request (URL not normalised yet). */
function readyQuery(filters: TransactionFilters, ready: boolean): AnalyticsQuery | null {
  return ready ? buildAnalyticsQuery(filters) : null
}

/**
 * `GET /analytics/summary` for the filters, requested only once `ready`. Failures are ApiErrors.
 * The data counts as fresh for 5 minutes and is not refetched on window focus.
 */
export function useSummary(filters: TransactionFilters, ready: boolean) {
  const query = readyQuery(filters, ready)
  return useQuery({
    queryKey: analyticsQueryKey('summary', query),
    queryFn:
      query === null
        ? skipToken
        : async ({ signal }) => {
            const { data } = await api.GET('/analytics/summary', { params: { query }, signal })
            if (data === undefined) throw new Error('Empty response')
            return data
          },
    ...QUERY_OPTIONS,
  })
}

/** `GET /analytics/timeseries` for the filters, with the same rules as `useSummary`. */
export function useTimeseries(filters: TransactionFilters, ready: boolean) {
  const query = readyQuery(filters, ready)
  return useQuery({
    queryKey: analyticsQueryKey('timeseries', query),
    queryFn:
      query === null
        ? skipToken
        : async ({ signal }) => {
            const { data } = await api.GET('/analytics/timeseries', {
              params: { query },
              signal,
            })
            return data ?? []
          },
    ...QUERY_OPTIONS,
  })
}
