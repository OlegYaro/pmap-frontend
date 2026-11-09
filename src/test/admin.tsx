import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { vi } from 'vitest'
import type { FailedTask, RunListItem, RunStatus } from '../api/admin-types'
import { createQueryClient } from '../app/queryClient'
import { jsonResponse, stubFetch, type FetchHandler } from './http'
import { TERRITORIES } from './territories'

export const RUN_ID = '1a2b3c4d-0000-0000-0000-000000000000'
export const OTHER_RUN_ID = '9f8e7d6c-0000-0000-0000-000000000000'

/** A finished `GET /admin/runs` row; `overrides` replace single fields. */
export function runListItem(overrides: Partial<RunListItem> = {}): RunListItem {
  return {
    run_id: RUN_ID,
    trigger: 'manual',
    started_at: '2026-11-07T08:00:00',
    finished_at: '2026-11-07T08:30:00',
    total: 10,
    done: 8,
    not_published: 1,
    failed: 1,
    ...overrides,
  }
}

/** A failed task of a run; `overrides` replace single fields. */
export function failedTask(overrides: Partial<FailedTask> = {}): FailedTask {
  return {
    id: 1,
    territory_code: '0264',
    status: 'failed',
    updated_at: '2026-11-07T08:20:00',
    failed_stage: 'downloading',
    error_trace: 'Traceback (most recent call last):\n  ValueError: boom',
    ...overrides,
  }
}

/** A `GET /admin/runs/{run_id}` body; `overrides` replace single fields. */
export function runStatus(overrides: Partial<RunStatus> = {}): RunStatus {
  return {
    run_id: RUN_ID,
    started_at: '2026-11-07T08:00:00',
    total: 10,
    downloaded: 10,
    assigned: 9,
    cleaned: 9,
    loaded: 8,
    not_published: 1,
    failed: 1,
    in_progress: 0,
    current_stage: null,
    failed_tasks: [failedTask()],
    inserted: 120,
    updated: 30,
    excluded: { non_market: 5, package_deal: 20 },
    ...overrides,
  }
}

/** A territory list with the powiat `0264` (wrocławski) on top of the shared test territories. */
export const ADMIN_TERRITORIES = [
  ...TERRITORIES,
  {
    voivodeship_teryt: '02',
    voivodeship_name: 'dolnośląskie',
    powiat_teryt: '0264',
    powiat_name: 'wrocławski',
    gmina_teryt: null,
    gmina_name: null,
  },
]

interface AdminHandlers {
  runs?: FetchHandler
  run?: FetchHandler
  start?: FetchHandler
}

/**
 * A fetch handler for the admin page: `GET /api/admin/runs` answers with `runs`, `GET
 * /api/admin/runs/{id}` with `run`, `POST /api/admin/runs` with `start`, `/api/territories` with
 * `ADMIN_TERRITORIES` and anything else with an empty list. Defaults: one finished run, its
 * status, and a started run `OTHER_RUN_ID`.
 */
export function adminApi({
  runs = () => jsonResponse(200, [runListItem()]),
  run = () => jsonResponse(200, runStatus()),
  start = () => jsonResponse(202, { run_id: OTHER_RUN_ID }),
}: AdminHandlers = {}): FetchHandler {
  return (request) => {
    const path = new URL(request.url).pathname
    if (path === '/api/admin/runs')
      return request.method === 'POST' ? start(request) : runs(request)
    if (path.startsWith('/api/admin/runs/')) return run(request)
    if (path === '/api/territories') return jsonResponse(200, ADMIN_TERRITORIES)
    return jsonResponse(200, [])
  }
}

/** Stubs fetch with `adminApi(handlers)`. */
export function stubAdminApi(handlers: AdminHandlers = {}) {
  return stubFetch(adminApi(handlers))
}

/** Renders `hook` inside a fresh query client without retries; returns the client too. */
export function renderQueryHook<T>(hook: () => T) {
  const client = createQueryClient({ retry: false })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { ...renderHook(hook, { wrapper }), client }
}

/** Answers with the handlers in turn; the last one answers every further request. */
export function inTurn(...handlers: FetchHandler[]): FetchHandler {
  let next = 0
  return (request) => {
    const handler = handlers[Math.min(next, handlers.length - 1)]
    next += 1
    return handler(request)
  }
}

/** Fakes the clock and the timers TanStack Query polls with. Undo with `vi.useRealTimers()`. */
export function fakePollTimers() {
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
  })
}

/**
 * Fake time given to the answers to settle. Fake timers turn a 0 ms timeout set while timers run
 * into 1 ms, and TanStack Query schedules its notifications that way.
 */
const SETTLE_MS = 50

/** Advances the fake clock by `ms` (plus a short settle) and lets the answers sent meanwhile settle. */
export const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms + SETTLE_MS))
