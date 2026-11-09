import { QueryClient, type QueryObserverOptions } from '@tanstack/react-query'
import { ApiError } from '../api/errors'

const MAX_RETRIES = 2

/** A 4xx answer will not change on a second try; network failures and 5xx may. */
export function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
  return failureCount < MAX_RETRIES
}

/** A new client with the app's query defaults. `overrides` is for tests. */
export function createQueryClient(overrides: Partial<QueryObserverOptions> = {}): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, staleTime: 30_000, ...overrides },
    },
  })
}
