import { createContext } from 'react'
import type { TransactionFilters } from './model'

export interface FilterDraftApi {
  /** What the panel controls show; nothing is requested until it is applied. */
  draft: TransactionFilters
  /** True while the draft differs from the filters in the URL. */
  isDirty: boolean
  setDraft: (next: TransactionFilters) => void
  updateDraft: (patch: Partial<TransactionFilters>) => void
  /** Writes the draft to the URL as one pushed history entry (nothing happens when equal). */
  search: () => void
}

export const FilterDraftContext = createContext<FilterDraftApi | null>(null)
