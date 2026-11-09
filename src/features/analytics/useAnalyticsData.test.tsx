import { waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { expect, it } from 'vitest'
import { stubAnalyticsApi, summaryResponse } from '../../test/analytics'
import { callsTo } from '../../test/http'
import { renderWithRouter } from '../../test/render'
import { buildAnalyticsQuery, useSummary, useTimeseries } from './useAnalyticsData'
import { useAnalyticsFilters } from './useAnalyticsFilters'

let summary: ReturnType<typeof useSummary>
let timeseries: ReturnType<typeof useTimeseries>

function Probe() {
  const { filters, ready } = useAnalyticsFilters()
  const summaryResult = useSummary(filters, ready)
  const timeseriesResult = useTimeseries(filters, ready)
  useEffect(() => {
    summary = summaryResult
    timeseries = timeseriesResult
  })
  return null
}

/** Query params of a request as sorted [key, value] pairs. */
function paramsOf(request: Request) {
  return [...new URL(request.url).searchParams].sort()
}

const ENDPOINTS = ['/api/analytics/summary', '/api/analytics/timeseries']
const FORBIDDEN = [
  'sort',
  'order',
  'limit',
  'after_id',
  'after_value',
  'exclusion_reason',
  'address',
  'run_id',
]

it('requests both endpoints with the filters and the period only', async () => {
  const mock = stubAnalyticsApi()
  renderWithRouter(<Probe />, {
    path: '/analytics?powiat_code=0264&rooms=2&rooms=3&date_from=2025-01-01&date_to=2025-12-31&sort=price_premises&order=asc',
  })
  await waitFor(() => expect(summary.data).toEqual(summaryResponse()))
  await waitFor(() => expect(timeseries.data).toHaveLength(3))
  for (const endpoint of ENDPOINTS) {
    const calls = callsTo(mock, endpoint)
    expect(calls).toHaveLength(1)
    expect(paramsOf(calls[0])).toEqual([
      ['date_from', '2025-01-01'],
      ['date_to', '2025-12-31'],
      ['powiat_code', '0264'],
      ['rooms', '2'],
      ['rooms', '3'],
      ['voivodeship_code', '02'],
    ])
    const keys = new Set(new URL(calls[0].url).searchParams.keys())
    expect(FORBIDDEN.filter((key) => keys.has(key))).toEqual([])
  }
})

it('never sends the keys that do not apply', async () => {
  const mock = stubAnalyticsApi()
  renderWithRouter(<Probe />, {
    path: '/analytics?exclusion_reason=clean&address=Main&run_id=6f1c2a3b-4d5e-4f60-8a9b-0c1d2e3f4a5b&date_from=2025-01-01&date_to=2025-12-31',
  })
  await waitFor(() => expect(summary.isSuccess).toBe(true))
  await waitFor(() => expect(timeseries.isSuccess).toBe(true))
  for (const endpoint of ENDPOINTS) {
    for (const request of callsTo(mock, endpoint)) {
      const keys = new Set(new URL(request.url).searchParams.keys())
      expect(FORBIDDEN.filter((key) => keys.has(key))).toEqual([])
    }
  }
})

it('requests nothing before the period is in the URL', async () => {
  const mock = stubAnalyticsApi()
  renderWithRouter(<Probe />, { path: '/analytics' })
  await waitFor(() => expect(summary.isSuccess).toBe(true))
  await waitFor(() => expect(timeseries.isSuccess).toBe(true))
  for (const endpoint of ENDPOINTS) {
    const calls = callsTo(mock, endpoint)
    expect(calls).toHaveLength(1)
    const params = new URL(calls[0].url).searchParams
    expect(params.has('date_from')).toBe(true)
    expect(params.has('date_to')).toBe(true)
  }
})

it('builds no query without a complete period', () => {
  expect(buildAnalyticsQuery({ date_from: '2025-01-01' })).toBeNull()
  expect(buildAnalyticsQuery({ date_to: '2025-01-01' })).toBeNull()
  expect(
    buildAnalyticsQuery({
      date_from: '2025-01-01',
      date_to: '2025-12-31',
      exclusion_reason: ['clean'],
      address: 'Main',
      run_id: 'abc',
      rooms: [2],
    }),
  ).toEqual({ date_from: '2025-01-01', date_to: '2025-12-31', rooms: [2] })
})

it('keeps the data fresh and does not refetch on window focus', async () => {
  const mock = stubAnalyticsApi()
  renderWithRouter(<Probe />, { path: '/analytics?date_from=2025-01-01&date_to=2025-12-31' })
  await waitFor(() => expect(summary.isSuccess).toBe(true))
  window.dispatchEvent(new Event('focus'))
  document.dispatchEvent(new Event('visibilitychange'))
  await new Promise((resolve) => setTimeout(resolve, 20))
  expect(callsTo(mock, '/api/analytics/summary')).toHaveLength(1)
  expect(summary.isStale).toBe(false)
})
