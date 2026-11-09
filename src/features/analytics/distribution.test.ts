import { expect, it } from 'vitest'
import {
  buildDistribution,
  distributionDescription,
  nextSort,
  sortDistribution,
  type DistributionItem,
} from './distribution'

const groupsOf = (items: readonly DistributionItem[]) => items.map((item) => item.group)

const ROOMS = buildDistribution([
  { group: '3', count: 15 },
  { group: null, count: 2 },
  { group: '1', count: 5 },
])

it('labels the null group "Unknown" and puts it last', () => {
  expect(ROOMS).toEqual([
    { group: '1', count: 5, unknown: false },
    { group: '3', count: 15, unknown: false },
    { group: 'Unknown', count: 2, unknown: true },
  ])
})

it('orders numeric groups as numbers', () => {
  const floors = buildDistribution([
    { group: '10', count: 1 },
    { group: '2', count: 1 },
    { group: '0', count: 1 },
    { group: '-1', count: 1 },
  ])
  expect(groupsOf(floors)).toEqual(['-1', '0', '2', '10'])
})

it('puts text groups after the numbers in alphabetical order', () => {
  const items = buildDistribution([
    { group: null, count: 1 },
    { group: 'parter', count: 1 },
    { group: '4', count: 1 },
    { group: 'attic', count: 1 },
  ])
  expect(groupsOf(items)).toEqual(['4', 'attic', 'parter', 'Unknown'])
})

it('keeps a backend group spelled "Unknown" apart from the null group', () => {
  const items = buildDistribution([
    { group: null, count: 1 },
    { group: 'Unknown', count: 3 },
  ])
  expect(items.map((item) => item.unknown)).toEqual([false, true])
})

it('keeps the chart order without a sort', () => {
  expect(sortDistribution(ROOMS, null)).toEqual(ROOMS)
})

it('sorts by group in both directions', () => {
  expect(groupsOf(sortDistribution(ROOMS, { key: 'group', direction: 'asc' }))).toEqual([
    '1',
    '3',
    'Unknown',
  ])
  expect(groupsOf(sortDistribution(ROOMS, { key: 'group', direction: 'desc' }))).toEqual([
    'Unknown',
    '3',
    '1',
  ])
})

it('sorts by count in both directions, equal counts in group order', () => {
  expect(groupsOf(sortDistribution(ROOMS, { key: 'count', direction: 'asc' }))).toEqual([
    'Unknown',
    '1',
    '3',
  ])
  expect(groupsOf(sortDistribution(ROOMS, { key: 'count', direction: 'desc' }))).toEqual([
    '3',
    '1',
    'Unknown',
  ])
  const ties = buildDistribution([
    { group: '2', count: 4 },
    { group: '1', count: 4 },
  ])
  expect(groupsOf(sortDistribution(ties, { key: 'count', direction: 'desc' }))).toEqual(['1', '2'])
})

it('cycles a header ascending, descending, ascending', () => {
  const first = nextSort(null, 'count')
  expect(first).toEqual({ key: 'count', direction: 'asc' })
  const second = nextSort(first, 'count')
  expect(second).toEqual({ key: 'count', direction: 'desc' })
  expect(nextSort(second, 'count')).toEqual({ key: 'count', direction: 'asc' })
  expect(nextSort(second, 'group')).toEqual({ key: 'group', direction: 'asc' })
})

it('describes the groups and the largest one', () => {
  expect(distributionDescription('By rooms', ROOMS)).toBe(
    'Transactions by rooms, 3 groups, largest: 3 with 15 transactions',
  )
  expect(distributionDescription('By floor', [])).toBe('Transactions by floor, no groups')
})
