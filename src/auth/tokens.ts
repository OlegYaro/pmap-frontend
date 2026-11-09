/**
 * Everything about the session tokens lives here: where they are kept, login, logout and the
 * refresh. Moving the refresh token to a cookie later only changes this file.
 *
 * - Access token: memory only, gone on reload.
 * - Refresh token: sessionStorage, survives a reload of the tab. Each one works once.
 */
import createClient from 'openapi-fetch'
import { API_BASE_URL, sendRequest, throwApiErrors } from '../api/base'
import type { components, paths } from '../api/schema'

type TokenPair = components['schemas']['TokenResponse']
type Credentials = components['schemas']['LoginRequest']

const REFRESH_TOKEN_KEY = 'pmap.refresh_token'

let accessToken: string | null = null
let refreshInFlight: Promise<boolean> | null = null
let sessionEndedListener: (() => void) | null = null

function readRefreshToken(): string | null {
  try {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

function writeRefreshToken(token: string): void {
  try {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, token)
  } catch {
    // Storage unavailable: the session ends with this tab's memory.
  }
}

function removeRefreshToken(): void {
  try {
    sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch {
    // Nothing stored then.
  }
}

function storePair(pair: TokenPair): void {
  accessToken = pair.access_token
  writeRefreshToken(pair.refresh_token)
}

/** Sets `Authorization: Bearer <access token>` when a token is held. */
export function withAccessToken(request: Request, token: string | null = accessToken): Request {
  if (token !== null) request.headers.set('Authorization', `Bearer ${token}`)
  return request
}

// The /auth requests bypass the refresh-and-retry of the app client.
const authApi = createClient<paths>({
  baseUrl: API_BASE_URL,
  fetch: (request) => sendRequest(withAccessToken(request)),
})
authApi.use(throwApiErrors)

export function getAccessToken(): string | null {
  return accessToken
}

export function clearTokens(): void {
  accessToken = null
  removeRefreshToken()
}

/**
 * Registers the function called when a refresh fails and the session is over (the app sends the
 * user to the login screen). Replaces an earlier one. Returns a function that removes it.
 */
export function onSessionEnded(listener: () => void): () => void {
  sessionEndedListener = listener
  return () => {
    if (sessionEndedListener === listener) sessionEndedListener = null
  }
}

/** Logs in and stores the new tokens. Throws ApiError on failure and keeps the old tokens. */
export async function login(credentials: Credentials): Promise<void> {
  const { data } = await authApi.POST('/auth/login', { body: credentials })
  if (data) storePair(data)
}

/** Ends the session on the server (best effort) and here (always). */
export async function logout(): Promise<void> {
  const refreshToken = readRefreshToken()
  clearTokens()
  if (refreshToken === null) return
  try {
    await authApi.POST('/auth/logout', { body: { refresh_token: refreshToken } })
  } catch {
    // The tokens are gone here; an unrevoked refresh token dies with its expiry.
  }
}

async function runRefresh(refreshToken: string): Promise<boolean> {
  try {
    const { data } = await authApi.POST('/auth/refresh', { body: { refresh_token: refreshToken } })
    if (!data) throw new Error('Refresh returned no tokens')
    storePair(data)
    return true
  } catch {
    clearTokens()
    sessionEndedListener?.()
    return false
  }
}

/**
 * Gets a new access token after `tokenUsed` was refused. Resolves true when a newer access token
 * is available to retry with.
 *
 * - Another refresh already replaced `tokenUsed`: true at once, no request.
 * - A refresh is running: wait for it (one request at a time; each refresh token works once).
 * - No refresh token: false, nothing to end.
 * - The refresh fails: tokens cleared, session-ended listener called once, false.
 */
export function refreshTokens(tokenUsed: string | null): Promise<boolean> {
  if (accessToken !== null && accessToken !== tokenUsed) return Promise.resolve(true)
  if (refreshInFlight !== null) return refreshInFlight
  const refreshToken = readRefreshToken()
  if (refreshToken === null) return Promise.resolve(false)
  refreshInFlight = runRefresh(refreshToken).finally(() => {
    refreshInFlight = null
  })
  return refreshInFlight
}

/** Test helper: forget all session state. Not for app code. */
export function resetTokensForTests(): void {
  accessToken = null
  refreshInFlight = null
  sessionEndedListener = null
  removeRefreshToken()
}
