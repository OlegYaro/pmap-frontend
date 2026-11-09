import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../api/client'
import type { components } from '../../../api/schema'
import type { CreateBody, UpdateBody } from './payload'

type TransactionUpdate = components['schemas']['TransactionUpdate']

/** Prefix of every cached transaction list (see `listQueryKey`). */
export const TRANSACTION_LISTS_KEY = ['transactions', 'list'] as const

/** Key of one cached transaction (see `useTransaction`). */
export const transactionDetailKey = (id: number) => ['transactions', 'detail', id] as const

/**
 * Adds a transaction by hand (`POST /admin/transactions`) and resolves with the created record.
 * On success the cached lists are marked stale and the shown ones refetch. Failures are ApiErrors.
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateBody) => {
      const { data } = await api.POST('/admin/transactions', { body })
      if (!data) throw new Error('Empty response')
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TRANSACTION_LISTS_KEY })
    },
  })
}

/**
 * Corrects transaction `id` (`PATCH /admin/transactions/{id}`) and resolves with the saved record.
 * On success the lists and the transaction itself are marked stale and the shown ones refetch.
 * Failures are ApiErrors (404 when the transaction is gone).
 */
export function useUpdateTransaction(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: UpdateBody) => {
      const { data } = await api.PATCH('/admin/transactions/{transaction_id}', {
        params: { path: { transaction_id: id } },
        // The backend defaults `accept_registry` to false; the generated type marks it required.
        body: body as TransactionUpdate,
      })
      if (!data) throw new Error('Empty response')
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TRANSACTION_LISTS_KEY })
      void queryClient.invalidateQueries({ queryKey: transactionDetailKey(id) })
    },
  })
}
