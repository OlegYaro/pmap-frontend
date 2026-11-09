import type { HTMLAttributes } from 'react'
import { useDraftFilters } from '../useDraftFilters'
import { TextInputField } from './TextInputField'
import { dateDraft, decimalDraft, integerDraft, type DraftResult } from './parsers'

export type RangeKind = 'dates' | 'price' | 'area' | 'floor'

type RangeKey =
  | 'date_from'
  | 'date_to'
  | 'price_min'
  | 'price_max'
  | 'area_min'
  | 'area_max'
  | 'floor_min'
  | 'floor_max'

interface RangeConfig {
  legend: string
  /** Hidden word that makes each input's name unique: "Min price", "From date". */
  noun: string
  keys: readonly [RangeKey, RangeKey]
  labels: readonly [string, string]
  parse: (draft: string) => DraftResult<string | number>
  invalidMessage: string
  swappedMessage: string
  type?: 'date'
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
}

const MIN_MAX = ['Min', 'Max'] as const
const SWAPPED = 'Min is greater than max'

const RANGES: Record<RangeKind, RangeConfig> = {
  dates: {
    legend: 'Date',
    noun: 'date',
    keys: ['date_from', 'date_to'],
    labels: ['From', 'To'],
    parse: dateDraft,
    invalidMessage: 'Enter a date',
    swappedMessage: 'Start is after end',
    type: 'date',
  },
  price: {
    legend: 'Price (PLN)',
    noun: 'price',
    keys: ['price_min', 'price_max'],
    labels: MIN_MAX,
    parse: decimalDraft,
    invalidMessage: 'Enter a number',
    swappedMessage: SWAPPED,
    inputMode: 'decimal',
  },
  area: {
    legend: 'Area (m²)',
    noun: 'area',
    keys: ['area_min', 'area_max'],
    labels: MIN_MAX,
    parse: decimalDraft,
    invalidMessage: 'Enter a number',
    swappedMessage: SWAPPED,
    inputMode: 'decimal',
  },
  floor: {
    legend: 'Floor',
    noun: 'floor',
    keys: ['floor_min', 'floor_max'],
    labels: MIN_MAX,
    parse: integerDraft,
    invalidMessage: 'Enter a whole number',
    swappedMessage: SWAPPED,
  },
}

/**
 * Two inputs for the lower and upper bound of a date or number filter, editing the draft. A lower
 * bound above the upper one is kept but pointed out.
 */
export function RangeField({ kind }: { kind: RangeKind }) {
  const { filters, updateFilters } = useDraftFilters()
  const config = RANGES[kind]
  const [low, high] = config.keys.map((key) => filters[key])
  const swapped = low !== undefined && high !== undefined && low > high

  return (
    <fieldset className="grid min-w-0 gap-1.5">
      <legend className="mb-1.5 text-sm leading-none font-medium">{config.legend}</legend>
      <div className="grid grid-cols-2 gap-2">
        {config.keys.map((key, index) => (
          <TextInputField
            key={key}
            label={
              <span className="text-muted-foreground text-xs font-normal">
                {config.labels[index]} <span className="sr-only">{config.noun}</span>
              </span>
            }
            value={filters[key]}
            parse={config.parse}
            format={String}
            invalidMessage={config.invalidMessage}
            type={config.type}
            inputMode={config.inputMode}
            onChange={(value) => updateFilters({ [key]: value })}
          />
        ))}
      </div>
      {swapped && <p className="text-destructive text-xs">{config.swappedMessage}</p>}
    </fieldset>
  )
}
