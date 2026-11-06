import createClient from 'openapi-fetch'
import { getAccessToken, refreshTokens, withAccessToken } from '../auth/tokens'
import { API_BASE_URL, sendRequest, throwApiErrors } from './base'
import { parseBody } from './errors'
import type { paths } from './schema'

function isAuthRoute(request: Request): boolean {
  return new URL(request.url).pathname.startsWith('/api/auth/')
}

/**
 * The token was missing or refused. The gateway answers 401 without an Authorization header and
 * 403 {"message": ...} when its authorizer denies the token (expired, invalid). A 403 with
 * {"detail": ...} comes from the backend itself (e.g. "Admin role required") and is final.
 */
async function isAuthFailure(response: Response): Promise<boolean> {
  if (response.status === 401) return true
  if (response.status !== 403) return false
  const body = parseBody(await response.clone().text())
  return (
    typeof body === 'object' &&
    body !== null &&
    typeof (body as Record<string, unknown>).message === 'string' &&
    !('detail' in body)
  )
}

/**
 * Sends a request with the current access token. On an auth failure it gets a new token (one
 * shared refresh for all callers) and sends the request once more. If the refresh fails, the
 * original response is returned and becomes an ApiError.
 */
export async function authFetch(request: Request): Promise<Response> {
  const retry = request.clone()
  const tokenUsed = getAccessToken()
  const response = await sendRequest(withAccessToken(request, tokenUsed))
  if (isAuthRoute(request) || !(await isAuthFailure(response))) return response
  if (!(await refreshTokens(tokenUsed))) return response
  return sendRequest(withAccessToken(retry))
}

/** Typed client of the PMAP backend. Calls return `{ data }` or reject with an ApiError. */
export const api = createClient<paths>({ baseUrl: API_BASE_URL, fetch: authFetch })
api.use(throwApiErrors)
