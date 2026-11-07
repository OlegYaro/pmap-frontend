import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { PRESERVED_PARAMS, type HistoryMode, type TransactionFilters } from './model'
import { parseFilters, sameFilters, serializeFilters } from './params'

export interface FilterChangeOptions {
  /** `replace` while typing, `push` for a discrete choice (Back then restores the previous filters). */
  history: HistoryMode
}

export interface FiltersApi {
  /** The current filters; the same object while the filter part of the URL is unchanged. */
  filters: TransactionFilters
  /** Replaces all filters. */
  setFilters: (next: TransactionFilters, options: FilterChangeOptions) => void
  /** Merges a patch into the filters; a key set to `undefined` is removed. */
  updateFilters: (patch: Partial<TransactionFilters>, options: FilterChangeOptions) => void
  /** Removes every filter as one pushed history entry. */
  resetFilters: () => void
}

/**
 * Transaction filters kept in the URL search params. Every change writes the filters in canonical
 * form, keeps only `PRESERVED_PARAMS` of the other params (paging cursors are dropped) and does
 * nothing when the filters stay equal.
 */
export function useFilters(): FiltersApi {
  const [searchParams, setSearchParams] = useSearchParams()
  const filterString = serializeFilters(parseFilters(searchParams)).toString()
  const filters = useMemo(() => parseFilters(new URLSearchParams(filterString)), [filterString])

  const setFilters = useCallback(
    (next: TransactionFilters, { history }: FilterChangeOptions) => {
      if (sameFilters(next, filters)) return
      const params = serializeFilters(next)
      for (const key of PRESERVED_PARAMS) {
        for (const value of searchParams.getAll(key)) params.append(key, value)
      }
      setSearchParams(params, { replace: history === 'replace', preventScrollReset: true })
    },
    [filters, searchParams, setSearchParams],
  )

  const updateFilters = useCallback(
    (patch: Partial<TransactionFilters>, options: FilterChangeOptions) =>
      setFilters({ ...filters, ...patch }, options),
    [filters, setFilters],
  )

  const resetFilters = useCallback(() => setFilters({}, { history: 'push' }), [setFilters])

  return { filters, setFilters, updateFilters, resetFilters }
}
