import type { components } from '../api/schema'
import { jsonResponse, stubFetch, type FetchHandler } from './http'
import { TERRITORIES } from './territories'

type SummaryResponse = components['schemas']['SummaryResponse']
type TimeseriesPoint = components['schemas']['TimeseriesPoint']

/** A complete `GET /analytics/summary` answer; `overrides` replace single fields. */
export function summaryResponse(overrides: Partial<SummaryResponse> = {}): SummaryResponse {
  return {
    median: 11000,
    count: 40,
    previous_median: 10000,
    previous_count: 36,
    change_pct: 10,
    rooms: [
      { group: '3', count: 15 },
      { group: null, count: 2 },
      { group: '1', count: 5 },
    ],
    floors: [
      { group: '10', count: 4 },
      { group: '2', count: 20 },
      { group: '0', count: 6 },
    ],
    ...overrides,
  }
}

/** A `GET /analytics/timeseries` point; `overrides` replace single fields. */
export function timeseriesPoint(overrides: Partial<TimeseriesPoint> = {}): TimeseriesPoint {
  return { month: '2025-03-01', count: 12, p25: 9000, median: 10000, p75: 11000, ...overrides }
}

/** Three consecutive months with values. */
export function timeseriesResponse(): TimeseriesPoint[] {
  return [
    timeseriesPoint({ month: '2025-01-01', count: 10, p25: 8800, median: 9500, p75: 10500 }),
    timeseriesPoint({ month: '2025-02-01', count: 8, p25: 8900, median: 9800, p75: 10800 }),
    timeseriesPoint(),
  ]
}

/**
 * Stubs fetch: `/api/territories` answers with `TERRITORIES`, `/api/analytics/summary` with
 * `summary` and `/api/analytics/timeseries` with `timeseries` (the defaults above), anything else
 * with an empty list.
 */
export function stubAnalyticsApi({
  summary = () => jsonResponse(200, summaryResponse()),
  timeseries = () => jsonResponse(200, timeseriesResponse()),
}: { summary?: FetchHandler; timeseries?: FetchHandler } = {}) {
  return stubFetch((request) => {
    const path = new URL(request.url).pathname
    if (path === '/api/territories') return jsonResponse(200, TERRITORIES)
    if (path === '/api/analytics/summary') return summary(request)
    if (path === '/api/analytics/timeseries') return timeseries(request)
    return jsonResponse(200, [])
  })
}

/**
 * Answers every request with an empty list and the analytics summary with an empty summary, for
 * tests that render a page only for its layout.
 */
export const emptyApi: FetchHandler = (request) => {
  if (new URL(request.url).pathname !== '/api/analytics/summary') return jsonResponse(200, [])
  return jsonResponse(
    200,
    summaryResponse({ median: null, count: 0, change_pct: null, rooms: [], floors: [] }),
  )
}
