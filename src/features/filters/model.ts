import type { operations } from '../../api/schema'

/** Query of `GET /transactions` without the list-only keys: the filters shared with analytics and export. */
type FilterQuery = Omit<
  NonNullable<operations['list_transactions_transactions_get']['parameters']['query']>,
  'limit' | 'sort' | 'order' | 'after_value' | 'after_id'
>
type TimeseriesQuery = NonNullable<
  operations['get_timeseries_analytics_timeseries_get']['parameters']['query']
>

/** Exclusion reasons known to the backend, in display order. `clean` means "no exclusion reason". */
export const EXCLUSION_REASONS = [
  'clean',
  'fractional_share',
  'package_deal',
  'non_market',
  'missing_fields',
  'implausible_area',
  'unassigned',
  'no_city_district',
  'implausible_price',
] as const

export type ExclusionReason = (typeof EXCLUSION_REASONS)[number]

/** Transaction filters as read from the URL. An absent key means "not filtered". */
export interface TransactionFilters {
  voivodeship_code?: string
  powiat_code?: string
  gmina_code?: string
  city_name?: string
  district_name?: string
  date_from?: string
  date_to?: string
  price_min?: number
  price_max?: number
  area_min?: number
  area_max?: number
  rooms?: number[]
  floor_min?: number
  floor_max?: number
  function?: string
  address?: string
  exclusion_reason?: ExclusionReason[]
  run_id?: string
}

export type FilterKey = keyof TransactionFilters

/**
 * Query parameters the API has but the app offers no filter for: the stored `market_type` values are
 * spelled in several ways and the backend matches one exact value.
 */
export type UnusedApiFilterKey = 'market_type'

/** Every filter key in the canonical order used in URLs. */
export const FILTER_KEYS = [
  'voivodeship_code',
  'powiat_code',
  'gmina_code',
  'city_name',
  'district_name',
  'date_from',
  'date_to',
  'price_min',
  'price_max',
  'area_min',
  'area_max',
  'rooms',
  'floor_min',
  'floor_max',
  'function',
  'address',
  'exclusion_reason',
  'run_id',
] as const satisfies readonly FilterKey[]

/** Search params that are not filters but survive a filter change. Everything else is dropped. */
export const PRESERVED_PARAMS = ['sort', 'order'] as const

/** "5+" rooms: the API has no minimum, so it is sent as this list of counts. */
export const ROOMS_PLUS = [5, 6, 7, 8, 9, 10] as const
export const ROOMS_PLUS_FROM = 5

/** Controls of the filter panel, in display order. */
export const FILTER_FIELDS = [
  'territory',
  'dates',
  'price',
  'area',
  'rooms',
  'floor',
  'function',
  'rows',
  'address',
  'city',
  'district',
] as const

export type FilterField = (typeof FILTER_FIELDS)[number]

/** How a filter change enters the browser history. */
export type HistoryMode = 'replace' | 'push'

type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
type Assert<T extends true> = T

/** Compile-time checks: the model matches the generated API query types (fails `tsc -b` otherwise). */
export type FilterModelChecks = [
  Assert<Exact<FilterKey | UnusedApiFilterKey, keyof FilterQuery>>,
  Assert<Exact<FilterKey | UnusedApiFilterKey, keyof TimeseriesQuery>>,
  Assert<Exact<FilterKey, (typeof FILTER_KEYS)[number]>>,
  Assert<TransactionFilters extends FilterQuery ? true : false>,
]
