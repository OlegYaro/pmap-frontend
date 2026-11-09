import type { components, operations } from '../../api/schema'
import type { TransactionFilters } from '../filters/model'
import { serializeFilters } from '../filters/params'
import type { ListSort } from './sort'

export type TransactionRow = components['schemas']['TransactionResponse']
type ListQuery = NonNullable<
  operations['list_transactions_transactions_get']['parameters']['query']
>

/** Rows per page. A shorter page is the last one: the API gives no total count. */
export const PAGE_SIZE = 50

/**
 * Keyset position after the last loaded row: its `id`, and its value of the sort field as text.
 * `after_value` is absent when sorting by `id` or when that value is null.
 */
export interface ListCursor {
  after_id: number
  after_value?: string
}

/**
 * What the list keeps in its history entry: the cursors of page 2, 3, ... up to the shown page.
 * An entry without it (a new filter or sort, a fresh link) shows page 1.
 */
export interface PageState {
  pageCursors: ListCursor[]
}

function isCursor(value: unknown): value is ListCursor {
  if (typeof value !== 'object' || value === null) return false
  const { after_id: id, after_value: after } = value as Record<string, unknown>
  return Number.isInteger(id) && (after === undefined || typeof after === 'string')
}

/** The cursor stack of a history entry's state; anything unexpected counts as page 1. */
export function readPageCursors(state: unknown): ListCursor[] {
  if (typeof state !== 'object' || state === null) return []
  const { pageCursors } = state as Record<string, unknown>
  if (!Array.isArray(pageCursors) || !pageCursors.every(isCursor)) return []
  return pageCursors.map(({ after_id, after_value }) =>
    after_value === undefined ? { after_id } : { after_id, after_value },
  )
}

/** The `GET /transactions` query: filters, sort, page size and, after the first page, the cursor. */
export function buildListQuery(
  filters: TransactionFilters,
  sort: ListSort,
  cursor: ListCursor | null,
): ListQuery {
  return { ...filters, sort: sort.field, order: sort.order, limit: PAGE_SIZE, ...cursor }
}

/** The cursor for the page after `lastPage`, or undefined when `lastPage` was the last one. */
export function nextCursor(
  lastPage: readonly TransactionRow[],
  sort: ListSort,
): ListCursor | undefined {
  if (lastPage.length < PAGE_SIZE) return undefined
  const last = lastPage[lastPage.length - 1]
  const value = last[sort.field]
  if (sort.field === 'id' || value === null || value === undefined) return { after_id: last.id }
  return { after_id: last.id, after_value: String(value) }
}

/** Query key of the list: equal filters (in any order) and sort share one cache entry. */
export function listQueryKey(filters: TransactionFilters, sort: ListSort) {
  return [
    'transactions',
    'list',
    serializeFilters(filters).toString(),
    sort.field,
    sort.order,
  ] as const
}
