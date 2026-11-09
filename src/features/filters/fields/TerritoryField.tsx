import { useId } from 'react'
import { SearchableSelect } from '@/components/SearchableSelect'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { TransactionFilters } from '../model'
import {
  gminaChoices,
  powiatChoices,
  selectGmina,
  selectPowiat,
  selectVoivodeship,
  type TerritoryOption,
} from '../territoryOptions'
import { useDraftFilters } from '../useDraftFilters'
import { useTerritoryOptions } from '../useTerritoryOptions'

const toChoices = (list: readonly TerritoryOption[]) =>
  list.map((option) => ({ value: option.code, label: option.label }))

interface TerritoryLevelField {
  key: string
  label: string
  searchLabel: string
  value: string | undefined
  choices: { value: string; label: string }[]
  select: (filters: TransactionFilters, code?: string) => TransactionFilters
  disabled: boolean
}

/**
 * Voivodeship → powiat → gmina, each a searchable select. Choosing a level fills the levels above
 * and clears the ones below; every choice edits the draft.
 */
export function TerritoryField() {
  const id = useId()
  const { filters, setFilters } = useDraftFilters()
  const { status, options, refetch, isFetching } = useTerritoryOptions()
  const ready = status === 'success'

  const levels: TerritoryLevelField[] = [
    {
      key: 'voivodeship',
      label: 'Voivodeship',
      searchLabel: 'Search voivodeships',
      value: filters.voivodeship_code,
      choices: toChoices(options.voivodeships),
      select: selectVoivodeship,
      disabled: !ready,
    },
    {
      key: 'powiat',
      label: 'Powiat',
      searchLabel: 'Search powiats',
      value: filters.powiat_code,
      choices: toChoices(powiatChoices(options, filters.voivodeship_code)),
      select: selectPowiat,
      disabled: !ready,
    },
    {
      key: 'gmina',
      label: 'Gmina',
      searchLabel: 'Search gminas',
      value: filters.gmina_code,
      choices: toChoices(gminaChoices(options, filters.powiat_code)),
      select: selectGmina,
      disabled: !ready || filters.powiat_code === undefined,
    },
  ]

  return (
    <fieldset className="grid min-w-0 gap-1.5">
      <legend className="mb-1.5 text-sm leading-none font-medium">Territory</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {levels.map((level) => (
          <div key={level.key} className="grid min-w-0 gap-1.5">
            <Label id={`${id}-${level.key}`} className="text-muted-foreground text-xs font-normal">
              {level.label}
            </Label>
            <SearchableSelect
              labelId={`${id}-${level.key}`}
              options={level.choices}
              value={level.value}
              searchLabel={level.searchLabel}
              placeholder={
                status === 'pending' && level.value === undefined ? 'Loading…' : undefined
              }
              disabled={level.disabled}
              onChange={(code) => setFilters(level.select(filters, code))}
            />
          </div>
        ))}
      </div>
      {status === 'error' && (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-destructive">Could not load territories</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            Retry
          </Button>
        </div>
      )}
    </fieldset>
  )
}
