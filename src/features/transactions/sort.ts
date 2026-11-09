import type { operations } from '../../api/schema'

type ListQuery = NonNullable<
  operations['list_transactions_transactions_get']['parameters']['query']
>

export type SortField = NonNullable<ListQuery['sort']>
export type SortOrder = NonNullable<ListQuery['order']>

/** Every field `GET /transactions` can sort by. */
export const SORT_FIELDS = [
  'id',
  'transaction_date',
  'price_premises',
  'area_usable',
  'rooms',
  'floor',
  'market_type',
  'function',
  'address',
  'powiat_code',
  'gmina_code',
  'city_name',
  'district_name',
  'updated_at',
] as const satisfies readonly SortField[]

const SORT_ORDERS = ['asc', 'desc'] as const satisfies readonly SortOrder[]

/** The server-side order of the transaction list. */
export interface ListSort {
  field: SortField
  order: SortOrder
}

export const DEFAULT_SORT: ListSort = { field: 'transaction_date', order: 'desc' }

type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
type Assert<T extends true> = T

/** Compile-time checks: the lists match the generated API query types (fails `tsc -b` otherwise). */
export type SortChecks = [
  Assert<Exact<(typeof SORT_FIELDS)[number], SortField>>,
  Assert<Exact<(typeof SORT_ORDERS)[number], SortOrder>>,
]

function isOneOf<T extends string>(values: readonly T[], raw: string | null): raw is T {
  return raw !== null && (values as readonly string[]).includes(raw)
}

/** True when `value` is a field the API can sort by. */
export function isSortField(value: string): value is SortField {
  return isOneOf(SORT_FIELDS, value)
}

/** Reads `sort` and `order`; each missing or unknown value falls back to its default on its own. */
export function parseSort(params: URLSearchParams): ListSort {
  const field = params.get('sort')
  const order = params.get('order')
  return {
    field: isOneOf(SORT_FIELDS, field) ? field : DEFAULT_SORT.field,
    order: isOneOf(SORT_ORDERS, order) ? order : DEFAULT_SORT.order,
  }
}

/**
 * A copy of `params` with `sort` and `order` written last; values equal to the defaults are left
 * out, so the default sort gives no params at all.
 */
export function writeSort(params: URLSearchParams, sort: ListSort): URLSearchParams {
  const next = new URLSearchParams(params)
  next.delete('sort')
  next.delete('order')
  if (sort.field !== DEFAULT_SORT.field) next.append('sort', sort.field)
  if (sort.order !== DEFAULT_SORT.order) next.append('order', sort.order)
  return next
}

/** A header click: the sorted field flips its order, another field starts ascending. */
export function nextSort(current: ListSort, field: SortField): ListSort {
  if (current.field === field) return { field, order: current.order === 'asc' ? 'desc' : 'asc' }
  return { field, order: 'asc' }
}

export function sameSort(a: ListSort, b: ListSort): boolean {
  return a.field === b.field && a.order === b.order
}
