import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getAccessToken, login, onSessionEnded, resetTokensForTests } from '../auth/tokens'
import { callsTo, deferred, jsonResponse, stubFetch, tokenPair } from '../test/http'
import { api } from './client'
import { ApiError } from './errors'

const REFRESH = '/api/auth/refresh'
const ADMIN_TRANSACTIONS = '/api/admin/transactions'
const expired = () => jsonResponse(401, { message: 'Unauthorized' })

function bearer(request: Request): string | null {
  return request.headers.get('Authorization')
}

function path(request: Request): string {
  return new URL(request.url).pathname
}

/** Logs in through the real login flow, so the session holds A1 / R1. */
async function startSession(access = 'A1', refresh = 'R1') {
  stubFetch(() => tokenPair(access, refresh))
  await login({ login: 'anna', password: 'secret' })
}

const createTransaction = () =>
  api.POST('/admin/transactions', { body: { powiat_code: '1465', price_premises: 500000 } })

beforeEach(() => {
  resetTokensForTests()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('requests', () => {
  it('go to /api on the page origin and return the typed body', async () => {
    const fetch = stubFetch(() => jsonResponse(200, { id: 12 }))

    const { data } = await api.GET('/transactions/{transaction_id}', {
      params: { path: { transaction_id: 12 } },
    })

    expect(fetch.mock.calls[0][0].url).toBe(`${window.location.origin}/api/transactions/12`)
    expect(data).toEqual({ id: 12 })
  })

  it('carry no Authorization header without an access token', async () => {
    const fetch = stubFetch(() => jsonResponse(200, []))

    await api.GET('/territories')

    expect(bearer(fetch.mock.calls[0][0])).toBeNull()
  })

  it('carry the bearer token while one is held', async () => {
    await startSession('A1')
    const fetch = stubFetch(() => jsonResponse(200, []))

    await api.GET('/territories')

    expect(bearer(fetch.mock.calls[0][0])).toBe('Bearer A1')
  })

  it('reject with an ApiError for a backend error', async () => {
    stubFetch(() => jsonResponse(404, { detail: 'Transaction not found' }))

    const call = api.GET('/transactions/{transaction_id}', {
      params: { path: { transaction_id: 99 } },
    })

    await expect(call).rejects.toBeInstanceOf(ApiError)
    await expect(call).rejects.toMatchObject({ status: 404, message: 'Transaction not found' })
  })
})

describe('refresh and retry', () => {
  it('refreshes once on a 401 and retries the request with the new token and the same body', async () => {
    await startSession('A1', 'R1')
    const fetch = stubFetch((request) => {
      if (path(request) === REFRESH) return tokenPair('A2', 'R2')
      return bearer(request) === 'Bearer A2' ? jsonResponse(201, { id: 7 }) : expired()
    })

    const { data } = await createTransaction()

    expect(data).toEqual({ id: 7 })
    const refreshes = callsTo(fetch, REFRESH)
    expect(refreshes).toHaveLength(1)
    expect(await refreshes[0].json()).toEqual({ refresh_token: 'R1' })
    const sent = callsTo(fetch, ADMIN_TRANSACTIONS)
    expect(sent.map(bearer)).toEqual(['Bearer A1', 'Bearer A2'])
    expect(sent[1].method).toBe('POST')
    expect(await sent[1].json()).toEqual({ powiat_code: '1465', price_premises: 500000 })
    expect(getAccessToken()).toBe('A2')
  })

  it('shares one refresh between three parallel 401s', async () => {
    await startSession('A1', 'R1')
    const fetch = stubFetch((request) => {
      if (path(request) === REFRESH) return tokenPair('A2', 'R2')
      return bearer(request) === 'Bearer A2' ? jsonResponse(200, { ok: path(request) }) : expired()
    })

    const results = await Promise.all([
      api.GET('/admin/runs'),
      api.GET('/exports/{export_id}', { params: { path: { export_id: 'e1' } } }),
      api.POST('/exports'),
    ])

    expect(results.map((r) => r.data)).toEqual([
      { ok: '/api/admin/runs' },
      { ok: '/api/exports/e1' },
      { ok: '/api/exports' },
    ])
    expect(callsTo(fetch, REFRESH)).toHaveLength(1)
    // 3 first attempts + 3 retries + 1 refresh
    expect(fetch).toHaveBeenCalledTimes(7)
    const retries = fetch.mock.calls.map(([r]) => r).filter((r) => bearer(r) === 'Bearer A2')
    expect(retries).toHaveLength(3)
  })

  it('retries a late 401 with the already refreshed token, without a new refresh', async () => {
    await startSession('A1', 'R1')
    const lateAnswer = deferred<Response>()
    const fetch = stubFetch((request) => {
      if (path(request) === REFRESH) return tokenPair('A2', 'R2')
      if (bearer(request) === 'Bearer A2') return jsonResponse(200, [])
      return path(request) === '/api/exports/late' ? lateAnswer.promise : expired()
    })

    const late = api.GET('/exports/{export_id}', { params: { path: { export_id: 'late' } } })
    await api.GET('/admin/runs') // 401 -> refresh -> A2
    lateAnswer.resolve(jsonResponse(401, { message: 'Unauthorized' }))
    await late

    expect(callsTo(fetch, REFRESH)).toHaveLength(1)
    expect(callsTo(fetch, '/api/exports/late').map(bearer)).toEqual(['Bearer A1', 'Bearer A2'])
  })

  it('refreshes on the gateway 403 for a refused token', async () => {
    await startSession('A1', 'R1')
    const fetch = stubFetch((request) => {
      if (path(request) === REFRESH) return tokenPair('A2', 'R2')
      return bearer(request) === 'Bearer A2'
        ? jsonResponse(200, [])
        : jsonResponse(403, { message: 'Forbidden' })
    })

    await api.GET('/admin/runs')

    expect(callsTo(fetch, REFRESH)).toHaveLength(1)
    expect(callsTo(fetch, '/api/admin/runs').map(bearer)).toEqual(['Bearer A1', 'Bearer A2'])
  })

  it('does not refresh on the backend 403 for a missing role', async () => {
    await startSession('A1', 'R1')
    const fetch = stubFetch(() => jsonResponse(403, { detail: 'Admin role required' }))

    const call = api.GET('/admin/runs')

    await expect(call).rejects.toMatchObject({ status: 403, message: 'Admin role required' })
    expect(callsTo(fetch, REFRESH)).toHaveLength(0)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('does not refresh on a 401 from /auth/login', async () => {
    await startSession('A1', 'R1')
    const fetch = stubFetch(() => jsonResponse(401, { detail: 'Invalid login or password' }))

    const call = api.POST('/auth/login', { body: { login: 'anna', password: 'wrong' } })

    await expect(call).rejects.toMatchObject({ status: 401, message: 'Invalid login or password' })
    expect(callsTo(fetch, REFRESH)).toHaveLength(0)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('gives up after one retry when the new token is refused too', async () => {
    await startSession('A1', 'R1')
    const fetch = stubFetch((request) =>
      path(request) === REFRESH
        ? tokenPair('A2', 'R2')
        : jsonResponse(403, { message: 'Forbidden' }),
    )

    const call = api.GET('/admin/runs')

    await expect(call).rejects.toMatchObject({ status: 403, message: 'Forbidden' })
    expect(callsTo(fetch, REFRESH)).toHaveLength(1)
    expect(callsTo(fetch, '/api/admin/runs')).toHaveLength(2)
  })

  it('does not refresh without a refresh token', async () => {
    const ended = vi.fn()
    onSessionEnded(ended)
    const fetch = stubFetch(() => expired())

    await expect(api.GET('/admin/runs')).rejects.toMatchObject({ status: 401 })
    expect(callsTo(fetch, REFRESH)).toHaveLength(0)
    expect(ended).not.toHaveBeenCalled()
  })
})

describe('failed refresh', () => {
  it('clears the tokens, calls the callback once and fails with the original 401', async () => {
    await startSession('A1', 'R1')
    const ended = vi.fn()
    onSessionEnded(ended)
    const fetch = stubFetch((request) =>
      path(request) === REFRESH
        ? jsonResponse(401, { detail: 'Invalid refresh token' })
        : jsonResponse(401, { message: 'Unauthorized' }),
    )

    const call = createTransaction()

    await expect(call).rejects.toBeInstanceOf(ApiError)
    await expect(call).rejects.toMatchObject({ status: 401, message: 'Unauthorized' })
    expect(getAccessToken()).toBeNull()
    expect(sessionStorage.getItem('pmap.refresh_token')).toBeNull()
    expect(ended).toHaveBeenCalledTimes(1)
    expect(callsTo(fetch, ADMIN_TRANSACTIONS)).toHaveLength(1)
  })

  it('ends the session once for parallel requests sharing the refresh', async () => {
    await startSession('A1', 'R1')
    const ended = vi.fn()
    onSessionEnded(ended)
    const fetch = stubFetch((request) =>
      path(request) === REFRESH
        ? jsonResponse(401, { detail: 'Invalid refresh token' })
        : jsonResponse(401, { message: 'Unauthorized' }),
    )

    const results = await Promise.allSettled([
      api.GET('/admin/runs'),
      api.POST('/exports'),
      createTransaction(),
    ])

    expect(results.map((r) => r.status)).toEqual(['rejected', 'rejected', 'rejected'])
    for (const r of results) {
      expect((r as PromiseRejectedResult).reason).toBeInstanceOf(ApiError)
    }
    expect(callsTo(fetch, REFRESH)).toHaveLength(1)
    expect(ended).toHaveBeenCalledTimes(1)
  })
})
