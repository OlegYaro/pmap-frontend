import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { UNEXPECTED_RESPONSE } from '../../api/admin-types'
import { ApiError } from '../../api/errors'
import {
  advance,
  fakePollTimers,
  inTurn,
  renderQueryHook,
  RUN_ID,
  runStatus,
  stubAdminApi,
} from '../../test/admin'
import { callsTo, jsonResponse } from '../../test/http'
import { useRun } from './useRun'

const DETAIL = `/api/admin/runs/${RUN_ID}`

beforeEach(fakePollTimers)

afterEach(() => {
  vi.useRealTimers()
})

it('requests the run and returns its status', async () => {
  const mock = stubAdminApi()
  const { result } = renderQueryHook(() => useRun(RUN_ID, false))
  await advance(0)
  expect(result.current.data).toEqual(runStatus())
  expect(callsTo(mock, DETAIL)).toHaveLength(1)
})

it('requests nothing without a run id', async () => {
  const mock = stubAdminApi()
  const { result } = renderQueryHook(() => useRun(null, true))
  await advance(20_000)
  expect(mock).not.toHaveBeenCalled()
  expect(result.current.isPending).toBe(true)
})

it('polls every 5 s while the run is running, then requests it once more and stops', async () => {
  const mock = stubAdminApi()
  let running = true
  const { rerender } = renderQueryHook(() => useRun(RUN_ID, running))
  await advance(0)
  expect(callsTo(mock, DETAIL)).toHaveLength(1)
  await advance(5_000)
  expect(callsTo(mock, DETAIL)).toHaveLength(2)

  running = false
  rerender()
  await advance(0)
  expect(callsTo(mock, DETAIL)).toHaveLength(3)
  await advance(60_000)
  expect(callsTo(mock, DETAIL)).toHaveLength(3)
})

it('does not poll a finished run', async () => {
  const mock = stubAdminApi()
  renderQueryHook(() => useRun(RUN_ID, false))
  await advance(60_000)
  expect(callsTo(mock, DETAIL)).toHaveLength(1)
})

it('sends no request after unmount', async () => {
  const mock = stubAdminApi()
  const { unmount } = renderQueryHook(() => useRun(RUN_ID, true))
  await advance(0)
  unmount()
  await advance(60_000)
  expect(callsTo(mock, DETAIL)).toHaveLength(1)
})

it('keeps a 404 as an ApiError', async () => {
  stubAdminApi({ run: () => jsonResponse(404, { detail: 'Run not found' }) })
  const { result } = renderQueryHook(() => useRun(RUN_ID, false))
  await advance(0)
  expect(result.current.error).toBeInstanceOf(ApiError)
  expect(result.current.error).toMatchObject({ status: 404 })
})

it('turns a malformed body into an error', async () => {
  stubAdminApi({ run: () => jsonResponse(200, { ...runStatus(), excluded: [] }) })
  const { result } = renderQueryHook(() => useRun(RUN_ID, false))
  await advance(0)
  expect(result.current.error?.message).toBe(UNEXPECTED_RESPONSE)
})

it('keeps the previous status when a refresh fails', async () => {
  stubAdminApi({
    run: inTurn(
      () => jsonResponse(200, runStatus()),
      () => jsonResponse(502, { detail: 'Bad gateway' }),
    ),
  })
  const { result } = renderQueryHook(() => useRun(RUN_ID, true))
  await advance(0)
  await advance(5_000)
  expect(result.current.isError).toBe(true)
  expect(result.current.data).toEqual(runStatus())
})
