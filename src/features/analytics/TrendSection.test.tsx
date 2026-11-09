import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { timeseriesPoint, timeseriesResponse } from '../../test/analytics'
import { deferred } from '../../test/http'
import type { SectionQuery } from './AnalyticsSection'
import { TrendSection } from './TrendSection'
import type { TimeseriesPoint } from './useAnalyticsData'

// The chart module is held back until a test releases it, to see the skeleton while it loads.
let chunk = deferred<void>()

vi.mock('./AnalyticsCharts', async () => {
  const { trendDescription, trendMonthLabel, trendTooltipLines } = await import('./trend')
  const { ChartTooltip } = await import('./ChartTooltip')
  await chunk.promise
  return {
    // Stands in for the Recharts chart: its label, plus the tooltip of the first month.
    TrendChart: ({ trend }: { trend: Parameters<typeof trendDescription>[0] }) => (
      <div role="img" aria-label={trendDescription(trend)}>
        <ChartTooltip title={trendMonthLabel(trend[0])} lines={trendTooltipLines(trend[0])} />
      </div>
    ),
    DistributionChart: () => null,
  }
})

beforeEach(() => {
  chunk.resolve()
})

function query(overrides: Partial<SectionQuery<TimeseriesPoint[]>> = {}) {
  return {
    data: timeseriesResponse(),
    isPending: false,
    isError: false,
    error: null,
    isFetching: false,
    refetch: vi.fn(),
    ...overrides,
  }
}

it('shows a skeleton while the chart chunk loads, then the chart', async () => {
  chunk = deferred<void>()
  vi.resetModules()
  const { TrendSection: FreshSection } = await import('./TrendSection')
  render(<FreshSection query={query()} />)
  expect(screen.getByRole('status')).toHaveTextContent('Loading')
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
  chunk.resolve()
  expect(await screen.findByRole('img')).toBeInTheDocument()
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

it('shows a skeleton and no toggle while the data loads', () => {
  render(<TrendSection query={query({ data: undefined, isPending: true })} />)
  expect(screen.getByRole('status')).toHaveTextContent('Loading')
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

it('switches between chart and table', async () => {
  render(<TrendSection query={query()} />)
  const chart = await screen.findByRole('img')
  expect(chart).toHaveAccessibleName(
    'Median price per m² by month, 3 months, median from 9,500 PLN/m² to 10,000 PLN/m²',
  )
  fireEvent.click(screen.getByRole('button', { name: 'View as table' }))
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
  const table = screen.getByRole('table')
  expect(within(table).getAllByRole('row')).toHaveLength(4)
  fireEvent.click(screen.getByRole('button', { name: 'View as chart' }))
  expect(await screen.findByRole('img')).toBeInTheDocument()
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'View as table' })).toBeInTheDocument()
})

it('shows the tooltip text from the KPI formatters', async () => {
  render(<TrendSection query={query({ data: [timeseriesPoint()] })} />)
  await screen.findByRole('img')
  for (const text of ['March 2025', '10,000 PLN/m²', '9,000 PLN/m²', '11,000 PLN/m²', '12']) {
    expect(screen.getByText(text)).toBeInTheDocument()
  }
  for (const label of ['Median', 'P25', 'P75', 'Transactions']) {
    expect(screen.getByText(label)).toBeInTheDocument()
  }
})

it.each([
  ['an empty list', []],
  ['only unknown months', [timeseriesPoint({ month: null })]],
])('shows "No data for this period" for %s, without chart or toggle', (_name, data) => {
  render(<TrendSection query={query({ data })} />)
  expect(screen.getByText('No data for this period')).toBeInTheDocument()
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'View as table' })).not.toBeInTheDocument()
})

it('shows the error with a retry that refetches', () => {
  const refetch = vi.fn()
  render(
    <TrendSection
      query={query({ data: undefined, isError: true, error: new Error('Server error'), refetch })}
    />,
  )
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Could not load the monthly prices: Server error',
  )
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(refetch).toHaveBeenCalledTimes(1)
})
