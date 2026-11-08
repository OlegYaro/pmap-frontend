import { act, renderHook } from '@testing-library/react'
import { toast } from 'sonner'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { callsTo, deferred, jsonResponse, stubFetch } from '../../test/http'
import type { TransactionFilters } from '../filters/model'
import { downloadFile } from './download'
import { useExport } from './useExport'

vi.mock('sonner', () => ({ toast: { error: vi.fn(), dismiss: vi.fn() } }))
vi.mock('./download', () => ({ downloadFile: vi.fn() }))

const START = '/api/exports'
const STATUS = '/api/exports/e1'
const FILE_URL = 'https://files.example/e.csv'
const FILTERS: TransactionFilters = { powiat_code: '0264', rooms: [2, 3] }

type Handler = (request: Request) => Response | Promise<Response>

/** Answers the start with `{id: "e1"}` and each status request with the next of `statuses`. */
function stubExport(statuses: Handler[], start: Handler = () => jsonResponse(202, { id: 'e1' })) {
  let next = 0
  return stubFetch((request) => {
    const path = new URL(request.url).pathname
    if (path === START) return start(request)
    const handler = statuses[Math.min(next, statuses.length - 1)]
    next += 1
    return handler(request)
  })
}

const pending = () => jsonResponse(200, { status: 'pending' })

/** Advances the fake clock by `ms` and lets the answers of the requests sent meanwhile settle. */
const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))

function renderExport(filters: TransactionFilters = FILTERS) {
  return renderHook(() => useExport(filters))
}

/** Presses start and lets the start request finish. */
async function begin(result: ReturnType<typeof renderExport>['result']) {
  act(() => result.current.start())
  await advance(0)
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
  vi.mocked(toast.error).mockClear()
  vi.mocked(downloadFile).mockClear()
})

afterEach(() => {
  vi.useRealTimers()
})

it('downloads the file when the export is done', async () => {
  const mock = stubExport([pending, () => jsonResponse(200, { status: 'done', url: FILE_URL })])
  const { result } = renderExport()

  await begin(result)
  expect(result.current.status).toBe('running')
  expect(result.current.announcement).toBe('Preparing export')
  expect(callsTo(mock, STATUS)).toHaveLength(0)

  await advance(2_000)
  expect(callsTo(mock, STATUS)).toHaveLength(1)
  expect(result.current.status).toBe('running')
  await advance(2_000)

  expect(callsTo(mock, STATUS)).toHaveLength(2)
  expect(downloadFile).toHaveBeenCalledTimes(1)
  expect(downloadFile).toHaveBeenCalledWith(FILE_URL)
  expect(toast.error).not.toHaveBeenCalled()
  expect(result.current.status).toBe('idle')
  expect(result.current.announcement).toBe('Export ready')
  await advance(60_000)
  expect(callsTo(mock, STATUS)).toHaveLength(2)
})

it('shows the error text of a failed export', async () => {
  stubExport([() => jsonResponse(200, { status: 'failed', error: 'No rows' })])
  const { result } = renderExport()

  await begin(result)
  await advance(2_000)

  expect(toast.error).toHaveBeenCalledWith('Export failed: No rows')
  expect(downloadFile).not.toHaveBeenCalled()
  expect(result.current.status).toBe('idle')
  expect(result.current.announcement).toBe('Export failed')
})

it('shows a generic text when a failed export has no error', async () => {
  stubExport([() => jsonResponse(200, { status: 'failed' })])
  const { result } = renderExport()

  await begin(result)
  await advance(2_000)

  expect(toast.error).toHaveBeenCalledTimes(1)
  expect(vi.mocked(toast.error).mock.calls[0][0]).toMatch(/^Export failed: .+/)
  expect(result.current.status).toBe('idle')
})

it('shows the error of a failed start and can be started again', async () => {
  const mock = stubExport([pending], () => jsonResponse(502, { detail: 'Bad gateway' }))
  const { result } = renderExport()

  await begin(result)

  expect(toast.error).toHaveBeenCalledWith('Could not start the export: Bad gateway')
  expect(result.current.status).toBe('idle')
  await advance(10_000)
  expect(callsTo(mock, STATUS)).toHaveLength(0)

  await begin(result)
  expect(callsTo(mock, START)).toHaveLength(2)
  expect(result.current.status).toBe('idle')
})

it('treats a start without an id as an error', async () => {
  stubExport([pending], () => jsonResponse(202, {}))
  const { result } = renderExport()

  await begin(result)

  expect(toast.error).toHaveBeenCalledTimes(1)
  expect(result.current.status).toBe('idle')
})

it('stops with an error toast when a status request fails', async () => {
  const mock = stubExport([pending, () => jsonResponse(500, { detail: 'Boom' })])
  const { result } = renderExport()

  await begin(result)
  await advance(4_000)

  expect(toast.error).toHaveBeenCalledWith('Could not get the export status: Boom')
  expect(result.current.status).toBe('idle')
  await advance(60_000)
  expect(callsTo(mock, STATUS)).toHaveLength(2)
})

it('treats done without a url as an error and downloads nothing', async () => {
  stubExport([() => jsonResponse(200, { status: 'done' })])
  const { result } = renderExport()

  await begin(result)
  await advance(2_000)

  expect(toast.error).toHaveBeenCalledTimes(1)
  expect(downloadFile).not.toHaveBeenCalled()
  expect(result.current.status).toBe('idle')
})

it('polls every 2 s and every 5 s after 30 s', async () => {
  const sentAt: number[] = []
  stubExport([
    () => {
      sentAt.push(Date.now())
      return pending()
    },
  ])
  const { result } = renderExport()
  const startedAt = Date.now()

  await begin(result)
  await advance(46_000)

  expect(sentAt.map((time) => (time - startedAt) / 1000)).toEqual([
    2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 35, 40, 45,
  ])
})

it('gives up 10 minutes after the start', async () => {
  const mock = stubExport([pending])
  const { result } = renderExport()

  await begin(result)
  await advance(599_000)
  expect(result.current.status).toBe('running')
  expect(toast.error).not.toHaveBeenCalled()
  await advance(1_000)

  expect(toast.error).toHaveBeenCalledWith('The export is taking too long. Try again later.')
  expect(result.current.status).toBe('idle')
  const count = callsTo(mock, STATUS).length
  await advance(60_000)
  expect(callsTo(mock, STATUS)).toHaveLength(count)
})

it('ignores start while an export runs', async () => {
  const mock = stubExport([pending])
  const { result } = renderExport()

  await begin(result)
  act(() => result.current.start())
  await advance(0)
  await advance(2_000)
  act(() => result.current.start())
  await advance(0)

  expect(callsTo(mock, START)).toHaveLength(1)
})

it('ignores start while the start request is in flight', async () => {
  const held = deferred<Response>()
  const mock = stubExport([pending], () => held.promise)
  const { result } = renderExport()

  act(() => result.current.start())
  act(() => result.current.start())
  await advance(0)

  expect(callsTo(mock, START)).toHaveLength(1)
})

it('sends the filters and no sort or paging', async () => {
  const mock = stubExport([pending])
  const { result } = renderExport()

  await begin(result)

  const request = callsTo(mock, START)[0]
  expect(request.method).toBe('POST')
  const params = new URL(request.url).searchParams
  expect([...params].sort()).toEqual([
    ['powiat_code', '0264'],
    ['rooms', '2'],
    ['rooms', '3'],
  ])
  for (const key of ['sort', 'order', 'limit', 'after_id', 'after_value']) {
    expect(params.has(key)).toBe(false)
  }
})

it('stops polling on unmount without a toast or download', async () => {
  const mock = stubExport([pending, () => jsonResponse(200, { status: 'done', url: FILE_URL })])
  const { result, unmount } = renderExport()

  await begin(result)
  await advance(2_000)
  expect(callsTo(mock, STATUS)).toHaveLength(1)
  unmount()
  await advance(60_000)

  expect(callsTo(mock, STATUS)).toHaveLength(1)
  expect(toast.error).not.toHaveBeenCalled()
  expect(downloadFile).not.toHaveBeenCalled()
})

it('aborts a status request in flight on unmount and ignores its answer', async () => {
  const held = deferred<Response>()
  const mock = stubExport([() => held.promise])
  const { result, unmount } = renderExport()

  await begin(result)
  await advance(2_000)
  const request = callsTo(mock, STATUS)[0]
  expect(request.signal.aborted).toBe(false)
  unmount()
  expect(request.signal.aborted).toBe(true)
  held.resolve(jsonResponse(200, { status: 'done', url: FILE_URL }))
  await advance(0)

  expect(downloadFile).not.toHaveBeenCalled()
  expect(toast.error).not.toHaveBeenCalled()
})

it('aborts the start request on unmount', async () => {
  const held = deferred<Response>()
  const mock = stubExport([pending], () => held.promise)
  const { result, unmount } = renderExport()

  act(() => result.current.start())
  await advance(0)
  unmount()
  held.resolve(jsonResponse(202, { id: 'e1' }))
  await advance(10_000)

  expect(callsTo(mock, START)[0].signal.aborted).toBe(true)
  expect(callsTo(mock, STATUS)).toHaveLength(0)
  expect(toast.error).not.toHaveBeenCalled()
})
