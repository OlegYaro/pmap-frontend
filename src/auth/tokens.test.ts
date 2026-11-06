import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/errors'
import { callsTo, deferred, jsonResponse, stubFetch, tokenPair } from '../test/http'
import {
  getAccessToken,
  login,
  logout,
  onSessionEnded,
  refreshTokens,
  resetTokensForTests,
} from './tokens'

const REFRESH_KEY = 'pmap.refresh_token'

/** Every value in sessionStorage and localStorage. */
export function storedValues(): string[] {
  const values: string[] = []
  for (const storage of [sessionStorage, localStorage]) {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key !== null) values.push(storage.getItem(key) ?? '')
    }
  }
  return values
}

beforeEach(() => {
  resetTokensForTests()
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('login', () => {
  it('keeps the access token in memory and the refresh token in sessionStorage', async () => {
    const fetch = stubFetch(() => tokenPair('A1', 'R1'))

    await login({ login: 'anna', password: 'secret' })

    const [request] = callsTo(fetch, '/api/auth/login')
    expect(request.method).toBe('POST')
    expect(await request.json()).toEqual({ login: 'anna', password: 'secret' })
    expect(getAccessToken()).toBe('A1')
    expect(sessionStorage.getItem(REFRESH_KEY)).toBe('R1')
    expect(storedValues()).not.toContain('A1')
  })

  it('fails with the ApiError of a wrong password and keeps the old tokens', async () => {
    stubFetch(() => tokenPair('A1', 'R1'))
    await login({ login: 'anna', password: 'secret' })
    const ended = vi.fn()
    onSessionEnded(ended)
    const fetch = stubFetch(() => jsonResponse(401, { detail: 'Invalid login or password' }))

    const error = await login({ login: 'anna', password: 'wrong' }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 401, message: 'Invalid login or password' })
    expect(getAccessToken()).toBe('A1')
    expect(sessionStorage.getItem(REFRESH_KEY)).toBe('R1')
    expect(callsTo(fetch, '/api/auth/refresh')).toHaveLength(0)
    expect(ended).not.toHaveBeenCalled()
  })
})

describe('logout', () => {
  beforeEach(async () => {
    stubFetch(() => tokenPair('A1', 'R1'))
    await login({ login: 'anna', password: 'secret' })
  })

  it('sends the refresh token and clears both tokens even if the server fails', async () => {
    const ended = vi.fn()
    onSessionEnded(ended)
    const fetch = stubFetch(() => jsonResponse(500, { detail: 'Internal Server Error' }))

    await logout()

    const [request] = callsTo(fetch, '/api/auth/logout')
    expect(await request.json()).toEqual({ refresh_token: 'R1' })
    expect(getAccessToken()).toBeNull()
    expect(sessionStorage.getItem(REFRESH_KEY)).toBeNull()
    expect(ended).not.toHaveBeenCalled()
  })

  it('clears both tokens on a network error', async () => {
    stubFetch(() => {
      throw new TypeError('Failed to fetch')
    })

    await expect(logout()).resolves.toBeUndefined()

    expect(getAccessToken()).toBeNull()
    expect(sessionStorage.getItem(REFRESH_KEY)).toBeNull()
  })
})

describe('refreshTokens', () => {
  it('sends one request for concurrent calls and stores the new pair', async () => {
    sessionStorage.setItem(REFRESH_KEY, 'R1')
    const answer = deferred<Response>()
    const fetch = stubFetch(() => answer.promise)

    const first = refreshTokens(null)
    const second = refreshTokens(null)
    answer.resolve(tokenPair('A2', 'R2'))

    expect(await Promise.all([first, second])).toEqual([true, true])
    const calls = callsTo(fetch, '/api/auth/refresh')
    expect(calls).toHaveLength(1)
    expect(await calls[0].json()).toEqual({ refresh_token: 'R1' })
    expect(getAccessToken()).toBe('A2')
    expect(sessionStorage.getItem(REFRESH_KEY)).toBe('R2')
    expect(storedValues()).not.toContain('A2')
  })

  it('clears the tokens and calls the listener once when the refresh token is refused', async () => {
    sessionStorage.setItem(REFRESH_KEY, 'R1')
    const ended = vi.fn()
    onSessionEnded(ended)
    stubFetch(() => jsonResponse(401, { detail: 'Invalid refresh token' }))

    const results = await Promise.all([refreshTokens(null), refreshTokens(null)])

    expect(results).toEqual([false, false])
    expect(getAccessToken()).toBeNull()
    expect(sessionStorage.getItem(REFRESH_KEY)).toBeNull()
    expect(ended).toHaveBeenCalledTimes(1)
  })

  it('does nothing without a refresh token', async () => {
    const ended = vi.fn()
    onSessionEnded(ended)
    const fetch = stubFetch(() => tokenPair('A2', 'R2'))

    expect(await refreshTokens(null)).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
    expect(ended).not.toHaveBeenCalled()
  })
})
