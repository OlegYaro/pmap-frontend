import type { Middleware } from 'openapi-fetch'
import { toApiError } from './errors'

/**
 * The backend is served under /api on the page's own origin. Absolute, because Node's Request
 * (used under Vitest) does not accept relative URLs.
 */
export const API_BASE_URL = `${window.location.origin}/api`

/** Plain network call. Looks up fetch on every call so tests can stub it. */
export function sendRequest(request: Request): Promise<Response> {
  return globalThis.fetch(request)
}

/** Makes every non-2xx response reject the call with an ApiError. */
export const throwApiErrors: Middleware = {
  async onResponse({ response }) {
    if (!response.ok) throw await toApiError(response.clone())
    return undefined
  },
}
