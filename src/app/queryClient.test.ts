import { QueryObserver } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { ApiError } from '../api/errors'
import { createQueryClient } from './queryClient'

async function runFailingQuery(status: number) {
  const queryFn = vi.fn(() => Promise.reject(new ApiError(status, 'boom')))
  const client = createQueryClient({ retryDelay: 0 })
  const observer = new QueryObserver(client, { queryKey: ['x'], queryFn })
  await new Promise<void>((resolve) => {
    const stop = observer.subscribe((result) => {
      if (result.status === 'error') {
        stop()
        resolve()
      }
    })
  })
  return queryFn
}

it('does not retry a 4xx response', async () => {
  expect(await runFailingQuery(404)).toHaveBeenCalledTimes(1)
})

it('retries a 5xx response twice', async () => {
  expect(await runFailingQuery(503)).toHaveBeenCalledTimes(3)
})

it('retries a network failure', async () => {
  const queryFn = vi.fn(() => Promise.reject(new TypeError('failed to fetch')))
  const client = createQueryClient({ retryDelay: 0 })
  await client.fetchQuery({ queryKey: ['y'], queryFn }).catch(() => undefined)
  expect(queryFn).toHaveBeenCalledTimes(3)
})
