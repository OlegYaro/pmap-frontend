import { useQuery } from '@tanstack/react-query'
import { act, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { api } from '../../../api/client'
import { ApiError } from '../../../api/errors'
import { renderQueryHook } from '../../../test/admin'
import { callsTo, jsonResponse, stubFetch, type FetchHandler } from '../../../test/http'
import { transactionRow } from '../../../test/transactions'
import { useTransaction } from '../../transactions/useTransaction'
import { useCreateTransaction, useUpdateTransaction } from './useTransactionMutations'

const LIST_KEY = ['transactions', 'list', '', 'id', 'asc']

/** A shown transaction list, so its refetch can be counted. */
function useShownList() {
  return useQuery({
    queryKey: LIST_KEY,
    queryFn: async () => (await api.GET('/transactions')).data ?? [],
    staleTime: 5 * 60_000,
  })
}

/** `/api/admin/transactions...` answers with `admin`, the lists and the detail with rows. */
function stubTransactions(admin: FetchHandler) {
  return stubFetch((request) => {
    const path = new URL(request.url).pathname
    if (path.startsWith('/api/admin/transactions')) return admin(request)
    if (path === '/api/transactions') return jsonResponse(200, [transactionRow({ id: 42 })])
    return jsonResponse(200, transactionRow({ id: 42 }))
  })
}

describe('useCreateTransaction', () => {
  it('posts the body and resolves with the created record', async () => {
    const mock = stubTransactions(() => jsonResponse(201, transactionRow({ id: 777 })))
    const { result } = renderQueryHook(() => useCreateTransaction())

    let created: { id: number } | undefined
    await act(async () => {
      created = await result.current.mutateAsync({ powiat_code: '0264', price_premises: 450000 })
    })

    expect(created?.id).toBe(777)
    const [request] = callsTo(mock, '/api/admin/transactions')
    expect(request.method).toBe('POST')
    expect(await request.json()).toEqual({ powiat_code: '0264', price_premises: 450000 })
  })

  it('refetches a shown list and marks a hidden one stale', async () => {
    const mock = stubTransactions(() => jsonResponse(201, transactionRow({ id: 777 })))
    const { result, client } = renderQueryHook(() => ({
      list: useShownList(),
      create: useCreateTransaction(),
    }))
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))
    const hiddenKey = ['transactions', 'list', 'rooms=2', 'id', 'asc']
    client.setQueryData(hiddenKey, [])

    await act(() => result.current.create.mutateAsync({ powiat_code: '0264' }))

    await waitFor(() => expect(callsTo(mock, '/api/transactions')).toHaveLength(2))
    expect(client.getQueryState(hiddenKey)?.isInvalidated).toBe(true)
  })

  it('rejects with the ApiError of a 422', async () => {
    const detail = [{ loc: ['body', 'area_usable'], msg: 'Input should be greater than 0' }]
    stubTransactions(() => jsonResponse(422, { detail }))
    const { result } = renderQueryHook(() => useCreateTransaction())

    let failure: unknown
    await act(async () => {
      failure = await result.current.mutateAsync({ powiat_code: '0264' }).catch((e) => e)
    })

    expect(failure).toBeInstanceOf(ApiError)
    expect(failure).toMatchObject({ status: 422, body: { detail } })
  })
})

describe('useUpdateTransaction', () => {
  it('patches the transaction of the id with the body as given', async () => {
    const mock = stubTransactions(() => jsonResponse(200, transactionRow({ id: 42 })))
    const { result } = renderQueryHook(() => useUpdateTransaction(42))

    await act(() => result.current.mutateAsync({ price_premises: 460000 }))

    const [request] = callsTo(mock, '/api/admin/transactions/42')
    expect(request.method).toBe('PATCH')
    expect(await request.json()).toEqual({ price_premises: 460000 })
  })

  it('refetches the list and the transaction after a save', async () => {
    const mock = stubTransactions(() => jsonResponse(200, transactionRow({ id: 42 })))
    const { result } = renderQueryHook(() => ({
      list: useShownList(),
      detail: useTransaction(42),
      update: useUpdateTransaction(42),
    }))
    await waitFor(() => expect(result.current.detail.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))

    await act(() => result.current.update.mutateAsync({ accept_registry: true }))

    await waitFor(() => expect(callsTo(mock, '/api/transactions/42')).toHaveLength(2))
    await waitFor(() => expect(callsTo(mock, '/api/transactions')).toHaveLength(2))
  })

  it('rejects with the ApiError of a 404', async () => {
    stubTransactions(() => jsonResponse(404, { detail: 'Transaction not found' }))
    const { result } = renderQueryHook(() => useUpdateTransaction(42))

    let failure: unknown
    await act(async () => {
      failure = await result.current.mutateAsync({ rooms: 4 }).catch((e) => e)
    })

    expect(failure).toBeInstanceOf(ApiError)
    expect(failure).toMatchObject({ status: 404, message: 'Transaction not found' })
  })
})
