import { formatArea, formatIsoDate, formatNumber, formatPln } from '@/lib/format'
import { EXCLUSION_REASON_LABELS, FUNCTION_LABELS, labelFor } from './labels'
import { FILTER_FIELDS, ROOMS_PLUS_FROM, type FilterField, type TransactionFilters } from './model'
import {
  selectGmina,
  selectPowiat,
  selectVoivodeship,
  type TerritoryLevel,
} from './territoryOptions'

export interface FilterChip {
  /** Stable id within one chip list. */
  id: string
  label: string
  /** The filters without this chip's filter. */
  remove: (filters: TransactionFilters) => TransactionFilters
}

export type NameLookup = (level: TerritoryLevel, code: string) => string

const RUN_ID_PREFIX = 8

function rangeText<T>(
  low: T | undefined,
  high: T | undefined,
  plain: (value: T) => string,
  withUnit: (value: T) => string,
): string {
  if (low === undefined) return high === undefined ? '' : `up to ${withUnit(high)}`
  if (high === undefined) return `from ${withUnit(low)}`
  return `${plain(low)} – ${withUnit(high)}`
}

type RangeKey =
  | 'date_from'
  | 'date_to'
  | 'price_min'
  | 'price_max'
  | 'area_min'
  | 'area_max'
  | 'floor_min'
  | 'floor_max'

function rangeChip<K extends RangeKey>(
  filters: TransactionFilters,
  id: string,
  name: string,
  keys: readonly [K, K],
  plain: (value: NonNullable<TransactionFilters[K]>) => string,
  withUnit: (value: NonNullable<TransactionFilters[K]>) => string = plain,
): FilterChip[] {
  const low = filters[keys[0]] ?? undefined
  const high = filters[keys[1]] ?? undefined
  if (low === undefined && high === undefined) return []
  return [
    {
      id,
      label: `${name}: ${rangeText(low, high, plain, withUnit)}`,
      remove: (current) => ({ ...current, [keys[0]]: undefined, [keys[1]]: undefined }),
    },
  ]
}

function territoryChips(filters: TransactionFilters, nameOf: NameLookup): FilterChip[] {
  const chips: FilterChip[] = []
  const { voivodeship_code: voivodeship, powiat_code: powiat, gmina_code: gmina } = filters
  if (voivodeship !== undefined) {
    chips.push({
      id: 'voivodeship',
      label: `Voivodeship: ${nameOf('voivodeship', voivodeship)}`,
      remove: (current) => selectVoivodeship(current, undefined),
    })
  }
  if (powiat !== undefined) {
    chips.push({
      id: 'powiat',
      label: `Powiat: ${nameOf('powiat', powiat)}`,
      remove: (current) => selectPowiat(current, undefined),
    })
  }
  if (gmina !== undefined) {
    chips.push({
      id: 'gmina',
      label: `Gmina: ${nameOf('gmina', gmina)}`,
      remove: (current) => selectGmina(current, undefined),
    })
  }
  return chips
}

function roomChips(filters: TransactionFilters): FilterChip[] {
  const rooms = filters.rooms ?? []
  const chips: FilterChip[] = rooms
    .filter((room) => room < ROOMS_PLUS_FROM)
    .map((room) => ({
      id: `rooms-${room}`,
      label: `Rooms: ${room}`,
      remove: (current) => {
        const rest = (current.rooms ?? []).filter((value) => value !== room)
        return { ...current, rooms: rest.length > 0 ? rest : undefined }
      },
    }))
  if (rooms.some((room) => room >= ROOMS_PLUS_FROM)) {
    chips.push({
      id: 'rooms-plus',
      label: `Rooms: ${ROOMS_PLUS_FROM}+`,
      remove: (current) => {
        const rest = (current.rooms ?? []).filter((value) => value < ROOMS_PLUS_FROM)
        return { ...current, rooms: rest.length > 0 ? rest : undefined }
      },
    })
  }
  return chips
}

function textChip(
  filters: TransactionFilters,
  key: 'function' | 'address' | 'city_name' | 'district_name' | 'run_id',
  label: (value: string) => string,
): FilterChip[] {
  const value = filters[key]
  if (value === undefined) return []
  return [{ id: key, label: label(value), remove: (current) => ({ ...current, [key]: undefined }) }]
}

function rowChips(filters: TransactionFilters): FilterChip[] {
  return (filters.exclusion_reason ?? []).map((reason) => ({
    id: `rows-${reason}`,
    label: `Rows: ${EXCLUSION_REASON_LABELS[reason]}`,
    remove: (current) => {
      const rest = (current.exclusion_reason ?? []).filter((value) => value !== reason)
      return { ...current, exclusion_reason: rest.length > 0 ? rest : undefined }
    },
  }))
}

const CHIPS_BY_FIELD: Record<
  FilterField,
  (filters: TransactionFilters, nameOf: NameLookup) => FilterChip[]
> = {
  territory: territoryChips,
  dates: (f) => rangeChip(f, 'dates', 'Date', ['date_from', 'date_to'], formatIsoDate),
  price: (f) => rangeChip(f, 'price', 'Price', ['price_min', 'price_max'], formatNumber, formatPln),
  area: (f) => rangeChip(f, 'area', 'Area', ['area_min', 'area_max'], formatNumber, formatArea),
  rooms: roomChips,
  floor: (f) => rangeChip(f, 'floor', 'Floor', ['floor_min', 'floor_max'], formatNumber),
  function: (f) => textChip(f, 'function', (v) => `Function: ${labelFor(FUNCTION_LABELS, v)}`),
  rows: rowChips,
  address: (f) => textChip(f, 'address', (v) => `Address: "${v}"`),
  city: (f) => textChip(f, 'city_name', (v) => `City: ${v}`),
  district: (f) => textChip(f, 'district_name', (v) => `District: ${v}`),
}

/**
 * One chip per active filter of the shown `fields`, in panel order; `run_id` (no panel field)
 * comes last. Ranges are one chip; rooms and rows one chip per value, all rooms >= 5 one "5+" chip.
 */
export function buildChips(
  filters: TransactionFilters,
  nameOf: NameLookup,
  fields: readonly FilterField[] = FILTER_FIELDS,
): FilterChip[] {
  const chips = FILTER_FIELDS.filter((field) => fields.includes(field)).flatMap((field) =>
    CHIPS_BY_FIELD[field](filters, nameOf),
  )
  return [...chips, ...textChip(filters, 'run_id', (v) => `Run: ${v.slice(0, RUN_ID_PREFIX)}`)]
}
