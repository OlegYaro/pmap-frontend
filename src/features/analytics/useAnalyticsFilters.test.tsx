import { act, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { renderWithRouter } from '../../test/render'
import { useFilters, type FiltersApi } from '../filters/useFilters'
import {
  ANALYTICS_FIELDS,
  normalizeAnalyticsFilters,
  useAnalyticsFilters,
} from './useAnalyticsFilters'

let result: ReturnType<typeof useAnalyticsFilters>
let filtersApi: FiltersApi
const readyStates: boolean[] = []

function Probe() {
  const value = useAnalyticsFilters()
  const api = useFilters()
  readyStates.push(value.ready)
  useEffect(() => {
    result = value
    filtersApi = api
  })
  return null
}

function renderAt(path: string, previous: string[] = []) {
  return renderWithRouter(<Probe />, { path, previous })
}

beforeEach(() => {
  readyStates.length = 0
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 7, 12))
})

afterEach(() => {
  vi.useRealTimers()
})

it('offers every field but Rows and Address', () => {
  expect(ANALYTICS_FIELDS).toEqual([
    'territory',
    'dates',
    'price',
    'area',
    'rooms',
    'floor',
    'function',
    'city',
    'district',
  ])
})

it('normalises without changing a complete query', () => {
  const filters = { date_from: '2024-01-01', date_to: '2024-06-30', rooms: [2] }
  expect(normalizeAnalyticsFilters(filters, '2026-11-07')).toEqual(filters)
})

it('writes the default period and function on a fresh visit, replacing the entry', async () => {
  const { router } = renderAt('/analytics', ['/'])
  expect(readyStates[0]).toBe(false)
  await waitFor(() =>
    expect(router.state.location.search).toBe(
      '?date_from=2025-11-07&date_to=2026-11-07&function=mieszkalna',
    ),
  )
  expect(router.state.historyAction).toBe('REPLACE')
  expect(result.ready).toBe(true)
  expect(result.filters).toEqual({
    date_from: '2025-11-07',
    date_to: '2026-11-07',
    function: 'mieszkalna',
  })
})

it('settles in one step and Back leaves the page', async () => {
  const { router } = renderAt('/analytics', ['/'])
  await waitFor(() => expect(result.ready).toBe(true))
  // Not ready only before the one rewrite, ready ever after.
  const firstReady = readyStates.indexOf(true)
  expect(readyStates.slice(0, firstReady).every((ready) => !ready)).toBe(true)
  expect(readyStates.slice(firstReady).every(Boolean)).toBe(true)
  await act(() => router.navigate(-1))
  expect(router.state.location.pathname).toBe('/')
})

it('adds only the missing end when one is given', async () => {
  const { router } = renderAt('/analytics?date_from=2024-01-01')
  await waitFor(() =>
    expect(router.state.location.search).toBe('?date_from=2024-01-01&date_to=2026-11-07'),
  )
})

it('adds only the period to a shared link', async () => {
  const { router } = renderAt('/analytics?powiat_code=0264')
  await waitFor(() => expect(result.ready).toBe(true))
  expect(router.state.location.search).toBe(
    '?voivodeship_code=02&powiat_code=0264&date_from=2025-11-07&date_to=2026-11-07',
  )
})

it('drops the keys that do not apply', async () => {
  const { router } = renderAt(
    '/analytics?exclusion_reason=non_market&run_id=6f1c2a3b-4d5e-4f60-8a9b-0c1d2e3f4a5b&address=Main&powiat_code=0264',
  )
  await waitFor(() => expect(result.ready).toBe(true))
  const params = new URLSearchParams(router.state.location.search)
  expect(params.get('powiat_code')).toBe('0264')
  expect(params.get('date_from')).toBe('2025-11-07')
  expect(params.has('exclusion_reason')).toBe(false)
  expect(params.has('run_id')).toBe(false)
  expect(params.has('address')).toBe(false)
  expect(params.has('function')).toBe(false)
})

it('keeps a normalised URL as it is', () => {
  const { router } = renderAt('/analytics?date_from=2024-01-01&date_to=2024-06-30')
  expect(readyStates[0]).toBe(true)
  expect(router.state.location.search).toBe('?date_from=2024-01-01&date_to=2024-06-30')
})

it('returns to the defaults after a reset', async () => {
  const { router } = renderAt('/analytics?date_from=2024-01-01&date_to=2024-06-30&rooms=2')
  act(() => filtersApi.resetFilters())
  await waitFor(() =>
    expect(router.state.location.search).toBe(
      '?date_from=2025-11-07&date_to=2026-11-07&function=mieszkalna',
    ),
  )
})

it('brings the period back when it is removed', async () => {
  const { router } = renderAt('/analytics?date_from=2024-01-01&date_to=2024-06-30&rooms=2')
  act(() =>
    filtersApi.updateFilters({ date_from: undefined, date_to: undefined }, { history: 'push' }),
  )
  await waitFor(() =>
    expect(router.state.location.search).toBe('?date_from=2025-11-07&date_to=2026-11-07&rooms=2'),
  )
})

it('does not bring back a removed function', async () => {
  const { router } = renderAt('/analytics')
  await waitFor(() => expect(result.filters.function).toBe('mieszkalna'))
  act(() => filtersApi.updateFilters({ function: undefined }, { history: 'push' }))
  await waitFor(() =>
    expect(router.state.location.search).toBe('?date_from=2025-11-07&date_to=2026-11-07'),
  )
  expect(result.ready).toBe(true)
  expect(result.filters.function).toBeUndefined()
})
