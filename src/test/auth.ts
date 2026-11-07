import { jsonResponse, stubFetch, tokenPair, type FetchHandler } from './http'

/** Base64url without padding, from UTF-8 text. */
export function base64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** A JWT-shaped token with the given payload and a dummy signature (nothing checks it). */
export function fakeAccessToken(payload: Record<string, unknown>): string {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  return `${header}.${base64Url(JSON.stringify(payload))}.signature`
}

/** sessionStorage key of the refresh token in src/auth/tokens.ts. */
export const REFRESH_TOKEN_KEY = 'pmap.refresh_token'

/**
 * A reloaded tab: a refresh token is stored, and `/auth/refresh` answers with an access token for
 * user id `1` with `role`. Other requests go to `other` (an empty list by default).
 */
export function stubStoredSession(role: string, other: FetchHandler = () => jsonResponse(200, [])) {
  sessionStorage.setItem(REFRESH_TOKEN_KEY, 'R1')
  return stubFetch((request) =>
    new URL(request.url).pathname === '/api/auth/refresh'
      ? tokenPair(fakeAccessToken({ sub: '1', role }), 'R2')
      : other(request),
  )
}
