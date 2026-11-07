import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { parseSort, sameSort, writeSort, type ListSort } from './sort'

export interface SortApi {
  /** The current list sort; the same object while `sort` and `order` are unchanged. */
  sort: ListSort
  /** Writes the sort into the URL as a new history entry; an equal sort does nothing. */
  setSort: (next: ListSort) => void
}

/** The transaction list sort kept in the `sort` and `order` search params. */
export function useSort(): SortApi {
  const [searchParams, setSearchParams] = useSearchParams()
  const { field, order } = parseSort(searchParams)
  const sort = useMemo(() => ({ field, order }), [field, order])

  const setSort = useCallback(
    (next: ListSort) => {
      if (sameSort(next, sort)) return
      setSearchParams(writeSort(searchParams, next), { preventScrollReset: true })
    },
    [sort, searchParams, setSearchParams],
  )

  return { sort, setSort }
}
