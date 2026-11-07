import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'

/** The id from the URL as a positive whole number, or null when it is anything else. */
export function parseTransactionId(raw: string | undefined): number | null {
  if (raw === undefined || !/^[1-9]\d{0,14}$/.test(raw)) return null
  return Number(raw)
}

/**
 * One transaction by id (`GET /transactions/{id}`, public). A null id is never requested. Failures
 * are ApiErrors; a missing transaction is an ApiError with status 404. The data counts as fresh
 * for 5 minutes, like the list.
 */
export function useTransaction(id: number | null) {
  return useQuery({
    queryKey: ['transactions', 'detail', id],
    queryFn: async ({ signal }) => {
      const { data } = await api.GET('/transactions/{transaction_id}', {
        params: { path: { transaction_id: id ?? 0 } },
        signal,
      })
      if (!data) throw new Error('Empty response')
      return data
    },
    enabled: id !== null,
    staleTime: 5 * 60_000,
  })
}
