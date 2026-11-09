import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { FilterDraftContext, type FilterDraftApi } from './filterDraftContext'
import type { TransactionFilters } from './model'
import { sameFilters, serializeFilters } from './params'
import { useFilters } from './useFilters'

/**
 * Holds the filters being edited in the panel. The draft starts from the filters in the URL and is
 * replaced by them whenever they change (search, chip removal, reset, Back), so the URL stays the
 * only source of the applied filters.
 */
export function FilterDraftProvider({ children }: { children: ReactNode }) {
  const { filters: applied, setFilters } = useFilters()
  const appliedKey = serializeFilters(applied).toString()
  const [draft, setDraft] = useState<TransactionFilters>(applied)
  const [syncedKey, setSyncedKey] = useState(appliedKey)

  if (appliedKey !== syncedKey) {
    setSyncedKey(appliedKey)
    setDraft(applied)
  }

  const updateDraft = useCallback(
    (patch: Partial<TransactionFilters>) => setDraft((current) => ({ ...current, ...patch })),
    [],
  )
  const search = useCallback(() => setFilters(draft, { history: 'push' }), [draft, setFilters])

  const value = useMemo<FilterDraftApi>(
    () => ({
      draft,
      isDirty: !sameFilters(draft, applied),
      setDraft,
      updateDraft,
      search,
    }),
    [draft, applied, updateDraft, search],
  )

  return <FilterDraftContext.Provider value={value}>{children}</FilterDraftContext.Provider>
}
