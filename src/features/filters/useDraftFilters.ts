import { useContext } from 'react'
import { FilterDraftContext, type FilterDraftApi } from './filterDraftContext'
import type { TransactionFilters } from './model'

export interface DraftFiltersApi {
  /** The draft the controls edit. */
  filters: TransactionFilters
  /** Replaces the whole draft. */
  setFilters: (next: TransactionFilters) => void
  /** Merges a patch into the draft; a key set to `undefined` is removed. */
  updateFilters: (patch: Partial<TransactionFilters>) => void
}

/** The draft filters of the enclosing panel. The URL changes only when the draft is searched. */
export function useDraftFilters(): DraftFiltersApi {
  const api = useContext(FilterDraftContext)
  if (api === null) throw new Error('useDraftFilters must be used inside FilterDraftProvider')
  return { filters: api.draft, setFilters: api.setDraft, updateFilters: api.updateDraft }
}

/** Draft state with the search action, for the panel's own controls. */
export function useFilterDraft(): FilterDraftApi {
  const api = useContext(FilterDraftContext)
  if (api === null) throw new Error('useFilterDraft must be used inside FilterDraftProvider')
  return api
}
