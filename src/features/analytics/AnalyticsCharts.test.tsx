import { act, fireEvent, render, screen } from '@testing-library/react'
import { cloneElement, isValidElement, type ReactNode } from 'react'
import { expect, it, vi } from 'vitest'
import { timeseriesPoint } from '../../test/analytics'
import { DistributionChart, TrendChart } from './AnalyticsCharts'
import { buildDistribution } from './distribution'
import { buildTrend } from './trend'

// jsdom has no layout: the responsive container hands its chart a fixed size instead of measuring.
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>()
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) =>
      isValidElement<{ width?: number; height?: number }>(children)
        ? cloneElement(children, { width: 600, height: 300 })
        : children,
  }
})

const TREND = buildTrend([
  timeseriesPoint({ month: '2025-01-01', median: 9500, count: 10 }),
  timeseriesPoint({ month: '2025-02-01', median: null, count: 8 }),
  timeseriesPoint(),
])

it('exposes the trend chart as an image labelled with the months and median range', () => {
  render(<TrendChart trend={TREND} />)
  expect(
    screen.getByRole('img', {
      name: 'Median price per m² by month, 3 months, median from 9,500 PLN/m² to 10,000 PLN/m²',
    }),
  ).toBeInTheDocument()
  expect(screen.getByText('PLN/m²')).toBeInTheDocument()
  expect(screen.getAllByText('Transactions').length).toBeGreaterThan(0)
})

it('shows the month tooltip when a month is reached by keyboard', async () => {
  render(<TrendChart trend={TREND} />)
  const chart = screen.getByRole('img', { name: /by month/ })
  // Focus shows the first month; each arrow key moves one month (one per animation frame).
  act(() => chart.focus())
  expect(await screen.findByText('January 2025')).toBeInTheDocument()
  expect(screen.getByText('9,500 PLN/m²')).toBeInTheDocument()
  fireEvent.keyDown(chart, { key: 'ArrowRight' })
  expect(await screen.findByText('February 2025')).toBeInTheDocument()
  expect(screen.getByText('n/a')).toBeInTheDocument()
})

it('labels the distribution chart and writes each count on its bar', () => {
  const items = buildDistribution([
    { group: '3', count: 15 },
    { group: null, count: 2 },
    { group: '1', count: 5 },
  ])
  render(<DistributionChart title="By rooms" items={items} />)
  expect(
    screen.getByRole('img', {
      name: 'Transactions by rooms, 3 groups, largest: 3 with 15 transactions',
    }),
  ).toBeInTheDocument()
  for (const count of ['15', '2', '5']) {
    expect(screen.getAllByText(count).length).toBeGreaterThan(0)
  }
  expect(screen.getByText('Unknown')).toBeInTheDocument()
})
