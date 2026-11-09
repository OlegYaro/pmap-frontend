import { useFilterDraft } from '../features/filters/useDraftFilters'

/** A "Search" button that applies the filter draft, for tests of single filter fields. */
export function SearchButton() {
  const { search } = useFilterDraft()
  return (
    <button type="button" onClick={search}>
      Search
    </button>
  )
}
