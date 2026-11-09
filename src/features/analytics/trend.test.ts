import { expect, it } from 'vitest'
import { timeseriesPoint } from '../../test/analytics'
import { buildTrend, monthKey, trendDescription, trendMonthLabel, trendTooltipLines } from './trend'

it('reads the month from a date or month value', () => {
  expect(monthKey('2025-03-01')).toBe('2025-03')
  expect(monthKey('2025-03')).toBe('2025-03')
  expect(monthKey('2025-03-01T00:00:00Z')).toBe('2025-03')
  expect(monthKey(null)).toBeNull()
  expect(monthKey('March 2025')).toBeNull()
  expect(monthKey('2025-13-01')).toBeNull()
})

it('keeps a full month with its band', () => {
  expect(buildTrend([timeseriesPoint()])).toEqual([
    { month: '2025-03', count: 12, median: 10000, p25: 9000, p75: 11000, band: [9000, 11000] },
  ])
})

it('drops points with a null or unreadable month', () => {
  const trend = buildTrend([
    timeseriesPoint({ month: null }),
    timeseriesPoint({ month: 'soon' }),
    timeseriesPoint({ month: '2025-04-01' }),
  ])
  expect(trend.map((point) => point.month)).toEqual(['2025-04'])
})

it('sorts the months in time order', () => {
  const trend = buildTrend([
    timeseriesPoint({ month: '2025-03-01' }),
    timeseriesPoint({ month: '2024-12-01' }),
    timeseriesPoint({ month: '2025-01-01' }),
  ])
  expect(trend.map((point) => point.month)).toEqual(['2024-12', '2025-01', '2025-03'])
})

it('leaves out the band when p25 or p75 is missing and keeps a null median', () => {
  const [noP25, noMedian] = buildTrend([
    timeseriesPoint({ month: '2025-01-01', p25: null }),
    timeseriesPoint({ month: '2025-02-01', median: null }),
  ])
  expect(noP25.band).toBeNull()
  expect(noP25.median).toBe(10000)
  expect(noMedian.median).toBeNull()
  expect(noMedian.band).toEqual([9000, 11000])
})

it('formats the tooltip like the KPI values', () => {
  const [point] = buildTrend([timeseriesPoint()])
  expect(trendMonthLabel(point)).toBe('March 2025')
  expect(trendTooltipLines(point)).toEqual([
    { label: 'Median', value: '10,000 PLN/m²' },
    { label: 'P25', value: '9,000 PLN/m²' },
    { label: 'P75', value: '11,000 PLN/m²' },
    { label: 'Transactions', value: '12' },
  ])
})

it('shows "n/a" for missing tooltip values', () => {
  const [point] = buildTrend([timeseriesPoint({ median: null, p25: null, p75: null })])
  expect(trendTooltipLines(point).map((line) => line.value)).toEqual(['n/a', 'n/a', 'n/a', '12'])
})

it('describes the months and the median range', () => {
  const trend = buildTrend([
    timeseriesPoint({ month: '2025-01-01', median: 9500 }),
    timeseriesPoint({ month: '2025-02-01', median: null }),
    timeseriesPoint({ month: '2025-03-01', median: 10000 }),
  ])
  expect(trendDescription(trend)).toBe(
    'Median price per m² by month, 3 months, median from 9,500 PLN/m² to 10,000 PLN/m²',
  )
  expect(trendDescription(trend.slice(1, 2))).toBe(
    'Median price per m² by month, 1 month, no median available',
  )
})
