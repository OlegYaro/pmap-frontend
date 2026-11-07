import { SearchIcon, SlidersHorizontalIcon } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { buildChips } from './chips'
import { CategorySelectField } from './fields/CategorySelectField'
import { RangeField } from './fields/RangeField'
import { RoomsField } from './fields/RoomsField'
import { RowsField } from './fields/RowsField'
import { TerritoryField } from './fields/TerritoryField'
import { TextFilterField } from './fields/TextFilterField'
import { FUNCTION_LABELS } from './labels'
import { FILTER_FIELDS, type FilterField } from './model'
import { FilterDraftProvider } from './FilterDraftProvider'
import { useFilterDraft } from './useDraftFilters'
import { useFilters } from './useFilters'

const FIELDS: Record<FilterField, () => ReactNode> = {
  territory: () => <TerritoryField />,
  dates: () => <RangeField kind="dates" />,
  price: () => <RangeField kind="price" />,
  area: () => <RangeField kind="area" />,
  rooms: () => <RoomsField />,
  floor: () => <RangeField kind="floor" />,
  function: () => (
    <CategorySelectField filterKey="function" label="Function" labels={FUNCTION_LABELS} />
  ),
  rows: () => <RowsField />,
  address: () => (
    <TextFilterField filterKey="address" label="Address" helperText="Part of the address" />
  ),
  city: () => <TextFilterField filterKey="city_name" label="City" helperText="Exact name" />,
  district: () => (
    <TextFilterField filterKey="district_name" label="District" helperText="Exact name" />
  ),
}

/** The count only needs the number of chips, not their territory names. */
const codeOnly = (_level: string, code: string) => code

interface FilterPanelProps {
  /** Fields to show (default: all), always in the standard order. */
  fields?: readonly FilterField[]
  className?: string
}

/**
 * The transaction filter controls. They edit a draft; the filters in the URL (and so the search)
 * change only when the user presses "Search" or Enter in an input. The page decides where the
 * panel goes. Below the `md` breakpoint the fields are behind a "Filters" toggle; they stay mounted
 * while hidden, so typed values survive collapsing, and the Search button stays visible.
 */
export function FilterPanel(props: FilterPanelProps) {
  return (
    <FilterDraftProvider>
      <FilterPanelForm {...props} />
    </FilterDraftProvider>
  )
}

function FilterPanelForm({ fields = FILTER_FIELDS, className }: FilterPanelProps) {
  const contentId = useId()
  const { isDirty, search } = useFilterDraft()
  const [open, setOpen] = useState(false)
  const { filters } = useFilters()
  const count = buildChips(filters, codeOnly, fields).length
  const shown = FILTER_FIELDS.filter((field) => fields.includes(field))

  return (
    <form
      className={cn('grid gap-3', className)}
      onSubmit={(event) => {
        event.preventDefault()
        search()
      }}
    >
      <Button
        type="button"
        variant="outline"
        className="justify-self-start md:hidden"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((value) => !value)}
      >
        <SlidersHorizontalIcon aria-hidden />
        {count > 0 ? `Filters (${count})` : 'Filters'}
      </Button>
      <div
        id={contentId}
        data-state={open ? 'open' : 'closed'}
        className={cn(
          'grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
          open ? 'grid' : 'hidden md:grid',
        )}
      >
        {shown.map((field) => (
          <div
            key={field}
            data-field={field}
            className={cn('min-w-0', field === 'territory' && 'sm:col-span-full')}
          >
            {FIELDS[field]()}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">
          <SearchIcon aria-hidden />
          Search
        </Button>
        <p aria-live="polite" className="text-muted-foreground text-sm">
          {isDirty ? 'Unapplied changes' : ''}
        </p>
      </div>
    </form>
  )
}
