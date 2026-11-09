import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { UNEXPECTED_RESPONSE } from '../../api/admin-types'
import {
  advance,
  fakePollTimers,
  inTurn,
  renderQueryHook,
  runListItem,
  stubAdminApi,
} from '../../test/admin'
import { callsTo, jsonResponse } from '../../test/http'
import { useRuns } from './useRuns'

const RUNS = '/api/admin/runs'
const unfinished = () => jsonResponse(200, [runListItem({ finished_at: null })])
const finished = () => jsonResponse(200, [runListItem()])

beforeEach(fakePollTimers)

afterEach(() => {
  vi.useRealTimers()
})

it('requests the list with the limit and returns the rows', async () => {
  const mock = stubAdminApi({ runs: finished })
  const { result } = renderQueryHook(() => useRuns(50))
  await advance(0)

  expect(result.current.data).toEqual([runListItem()])
  const calls = callsTo(mock, RUNS)
  expect(calls).toHaveLength(1)
  expect(new URL(calls[0].url).searchParams.get('limit')).toBe('50')
})

it('polls every 5 s while a run is unfinished and stops when all are finished', async () => {
  const mock = stubAdminApi({ runs: inTurn(unfinished, unfinished, finished) })
  const { result } = renderQueryHook(() => useRuns(20))
  await advance(0)
  expect(callsTo(mock, RUNS)).toHaveLength(1)

  await advance(4_000)
  expect(callsTo(mock, RUNS)).toHaveLength(1)
  await advance(1_000)
  expect(callsTo(mock, RUNS)).toHaveLength(2)
  await advance(5_000)
  expect(callsTo(mock, RUNS)).toHaveLength(3)
  expect(result.current.data?.[0].finished_at).not.toBeNull()

  await advance(60_000)
  expect(callsTo(mock, RUNS)).toHaveLength(3)
})

it('does not poll when every run is finished', async () => {
  const mock = stubAdminApi({ runs: finished })
  renderQueryHook(() => useRuns(20))
  await advance(60_000)
  expect(callsTo(mock, RUNS)).toHaveLength(1)
})

it('sends no request after unmount', async () => {
  const mock = stubAdminApi({ runs: unfinished })
  const { unmount } = renderQueryHook(() => useRuns(20))
  await advance(0)
  unmount()
  await advance(60_000)
  expect(callsTo(mock, RUNS)).toHaveLength(1)
})

it('turns a malformed body into an error', async () => {
  stubAdminApi({ runs: () => jsonResponse(200, [{ ...runListItem(), total: '10' }]) })
  const { result } = renderQueryHook(() => useRuns(20))
  await advance(0)
  expect(result.current.isError).toBe(true)
  expect(result.current.error?.message).toBe(UNEXPECTED_RESPONSE)
})

it('keeps the previous rows when a refresh fails, and goes on polling', async () => {
  const mock = stubAdminApi({
    runs: inTurn(unfinished, () => jsonResponse(502, { detail: 'Bad gateway' }), unfinished),
  })
  const { result } = renderQueryHook(() => useRuns(20))
  await advance(0)
  await advance(5_000)

  expect(result.current.isError).toBe(true)
  expect(result.current.error?.message).toBe('Bad gateway')
  expect(result.current.data).toEqual([runListItem({ finished_at: null })])

  await advance(5_000)
  expect(callsTo(mock, RUNS)).toHaveLength(3)
  expect(result.current.isError).toBe(false)
})
