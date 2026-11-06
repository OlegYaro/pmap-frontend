import { vi } from 'vitest'

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function tokenPair(access: string, refresh: string): Response {
  return jsonResponse(200, {
    access_token: access,
    refresh_token: refresh,
    token_type: 'bearer',
    expires_in: 900,
  })
}

export type FetchHandler = (request: Request) => Response | Promise<Response>

/** Replaces global fetch with a mock that answers with `handler`. Each call gets a Request. */
export function stubFetch(handler: FetchHandler) {
  const mock = vi.fn((input: Request) => Promise.resolve(handler(input)))
  vi.stubGlobal('fetch', mock)
  return mock
}

/** Requests the mock received whose URL path is `path` (with the /api prefix). */
export function callsTo(mock: ReturnType<typeof stubFetch>, path: string): Request[] {
  return mock.mock.calls.map(([request]) => request).filter((r) => new URL(r.url).pathname === path)
}

/** A promise you resolve from outside, to hold a response back. */
export function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}
