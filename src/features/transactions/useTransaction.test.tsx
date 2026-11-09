import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { expect, it } from 'vitest'
import { createQueryClient } from '../../app/queryClient'
import { callsTo, jsonResponse } from '../../test/http'
import { stubApi, transactionRow } from '../../test/transactions'
import { parseTransactionId, useTransaction } from './useTransaction'

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>
}

it.each([
  ['42', 42],
  ['1', 1],
  ['abc', null],
  ['0', null],
  ['-1', null],
  ['4.5', null],
  ['007', null],
  ['', null],
  [undefined, null],
])('reads the route id %s as %s', (raw, expected) => {
  expect(parseTransactionId(raw)).toBe(expected)
})

it('requests the transaction once', async () => {
  const mock = stubApi({ transaction: () => jsonResponse(200, transactionRow({ id: 42 })) })
  const { result } = renderHook(() => useTransaction(42), { wrapper })
  await waitFor(() => expect(result.current.data?.id).toBe(42))
  expect(callsTo(mock, '/api/transactions/42')).toHaveLength(1)
})

it('does not request without a valid id', async () => {
  const mock = stubApi()
  const { result } = renderHook(() => useTransaction(null), { wrapper })
  await new Promise((resolve) => setTimeout(resolve, 50))
  expect(result.current.fetchStatus).toBe('idle')
  expect(callsTo(mock, '/api/transactions/42')).toHaveLength(0)
})

it('does not retry a 404', async () => {
  const mock = stubApi({ transaction: () => jsonResponse(404, { detail: 'Not found' }) })
  const { result } = renderHook(() => useTransaction(999), { wrapper })
  await waitFor(() => expect(result.current.isError).toBe(true))
  expect(callsTo(mock, '/api/transactions/999')).toHaveLength(1)
})
