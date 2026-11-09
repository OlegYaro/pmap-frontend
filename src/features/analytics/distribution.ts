import { formatNumber } from '@/lib/format'
import type { components } from '../../api/schema'

export type DistributionRow = components['schemas']['DistributionRow']

/** The label of the `null` group. */
export const UNKNOWN_GROUP = 'Unknown'

/** One bar of a distribution chart and one row of its table. */
export interface DistributionItem {
  /** The group as shown: the backend value, or "Unknown" for `null`. */
  group: string
  count: number
  /** True for the `null` group, which always sorts last in ascending order. */
  unknown: boolean
}

export type DistributionSortKey = 'group' | 'count'

export interface DistributionSort {
  key: DistributionSortKey
  direction: 'asc' | 'desc'
}

const NUMBER = /^-?\d+(\.\d+)?$/

/** Numbers ascending, then other text alphabetically, then "Unknown". */
export function compareGroups(a: DistributionItem, b: DistributionItem): number {
  if (a.unknown !== b.unknown) return a.unknown ? 1 : -1
  const aNumber = NUMBER.test(a.group)
  const bNumber = NUMBER.test(b.group)
  if (aNumber && bNumber) return Number(a.group) - Number(b.group)
  if (aNumber !== bNumber) return aNumber ? -1 : 1
  return a.group.localeCompare(b.group)
}

/** The chart's bars: `null` labelled "Unknown", in group order. */
export function buildDistribution(rows: readonly DistributionRow[]): DistributionItem[] {
  return rows
    .map((row) => ({
      group: row.group ?? UNKNOWN_GROUP,
      count: row.count,
      unknown: row.group === null,
    }))
    .sort(compareGroups)
}

/**
 * The table rows in the given order, sorted on the client. By group the descending order is the
 * ascending one reversed; by count equal counts keep the group order. Null keeps the chart order.
 */
export function sortDistribution(
  items: readonly DistributionItem[],
  sort: DistributionSort | null,
): DistributionItem[] {
  if (sort === null) return [...items]
  const sign = sort.direction === 'asc' ? 1 : -1
  if (sort.key === 'group') return [...items].sort((a, b) => sign * compareGroups(a, b))
  return [...items].sort((a, b) => sign * (a.count - b.count) || compareGroups(a, b))
}

/** The sort after activating a header: ascending first, then it alternates with descending. */
export function nextSort(
  current: DistributionSort | null,
  key: DistributionSortKey,
): DistributionSort {
  if (current?.key === key && current.direction === 'asc') return { key, direction: 'desc' }
  return { key, direction: 'asc' }
}

/** The chart's accessible name: the number of groups and the largest one. */
export function distributionDescription(title: string, items: readonly DistributionItem[]) {
  const groups = `${items.length} ${items.length === 1 ? 'group' : 'groups'}`
  const largest = items.reduce<DistributionItem | null>(
    (best, item) => (best === null || item.count > best.count ? item : best),
    null,
  )
  if (largest === null) return `Transactions ${title.toLowerCase()}, no groups`
  return `Transactions ${title.toLowerCase()}, ${groups}, largest: ${largest.group} with ${formatNumber(largest.count)} transactions`
}
