import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { api } from '../../api/client'
import type { TransactionFilters } from '../filters/model'
import {
  buildListQuery,
  listQueryKey,
  nextCursor,
  PAGE_SIZE,
  readPageCursors,
  type ListCursor,
  type PageState,
  type TransactionRow,
} from './listQuery'
import type { ListSort } from './sort'

const NO_ROWS: TransactionRow[] = []

/**
 * One page of the transaction list for `filters` and `sort`. The cursors of the visited pages are
 * kept in the history entry's state, so Back from a transaction shows the same page and a new
 * filter or sort (a new entry) starts at page 1. Failures are ApiErrors. The data counts as fresh
 * for 5 minutes (it only changes after a sync run) and is not refetched on window focus.
 */
export function useTransactionList(filters: TransactionFilters, sort: ListSort) {
  const location = useLocation()
  const navigate = useNavigate()
  const cursors = useMemo(() => readPageCursors(location.state), [location.state])
  const cursor: ListCursor | null = cursors.at(-1) ?? null

  const query = useQuery({
    queryKey: [
      ...listQueryKey(filters, sort),
      cursor?.after_id ?? null,
      cursor?.after_value ?? null,
    ],
    queryFn: async ({ signal }) => {
      const { data } = await api.GET('/transactions', {
        params: { query: buildListQuery(filters, sort, cursor) },
        signal,
      })
      return data ?? []
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  })

  const rows = query.data ?? NO_ROWS
  const hasNext = !query.isPlaceholderData && rows.length === PAGE_SIZE

  const showPage = useCallback(
    (pageCursors: ListCursor[]) => {
      const state: PageState = { pageCursors }
      void navigate(
        { pathname: location.pathname, search: location.search, hash: location.hash },
        { replace: true, state, preventScrollReset: true },
      )
    },
    [navigate, location.pathname, location.search, location.hash],
  )

  const goNext = useCallback(() => {
    const next = nextCursor(rows, sort)
    if (next) showPage([...cursors, next])
  }, [rows, sort, cursors, showPage])
  const goPrevious = useCallback(() => showPage(cursors.slice(0, -1)), [cursors, showPage])
  const goFirst = useCallback(() => showPage([]), [showPage])

  return { ...query, rows, page: cursors.length + 1, hasNext, goNext, goPrevious, goFirst }
}
