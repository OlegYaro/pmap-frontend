import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../auth/AuthProvider'
import { resetTokensForTests } from '../../auth/tokens'
import { emptyApi, stubAnalyticsApi, summaryResponse } from '../../test/analytics'
import { stubStoredSession } from '../../test/auth'
import { callsTo, deferred, jsonResponse } from '../../test/http'
import { renderWithRouter } from '../../test/render'
import { AnalyticsPage } from './AnalyticsPage'
import type { DistributionItem } from './distribution'
import type { TrendPoint } from './trend'

// Stands in for the Recharts module (no layout in jsdom): each chart is a labelled image.
vi.mock('./AnalyticsCharts', () => ({
  TrendChart: ({ trend }: { trend: TrendPoint[] }) => (
    <div role="img" aria-label={`Trend chart, ${trend.length} months`} />
  ),
  DistributionChart: ({ items }: { items: DistributionItem[] }) => (
    <div role="img" aria-label={`Distribution chart, ${items.length} groups`} />
  ),
}))

const SUMMARY = '/api/analytics/summary'
const TIMESERIES = '/api/analytics/timeseries'
const PERIOD = 'date_from=2025-01-01&date_to=2025-12-31'

const region = (name: string) => screen.getByRole('region', { name })
const follows = (a: Node, b: Node) =>
  Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)

function renderAt(path: string) {
  return renderWithRouter(
    <AuthProvider>
      <AnalyticsPage />
    </AuthProvider>,
    { path, previous: ['/'] },
  )
}

beforeEach(() => {
  resetTokensForTests()
  sessionStorage.clear()
  localStorage.clear()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 7, 12))
})

afterEach(() => {
  vi.useRealTimers()
})

it('shows the header, presets, filters, chips, sections and note in order', async () => {
  stubAnalyticsApi()
  const { container } = renderAt(`/analytics?${PERIOD}`)
  await within(region('Key figures')).findByText('Median price per m²')
  await within(region('Price per m² by month')).findByRole('img')
  const parts = [
    screen.getByRole('heading', { level: 1, name: 'Analytics' }),
    screen.getByRole('group', { name: 'Period' }),
    screen.getByRole('group', { name: 'Territory' }),
    screen.getByRole('button', { name: 'Search' }),
    region('Active filters'),
    region('Key figures'),
    region('Price per m² by month'),
    region('By rooms'),
    region('By floor'),
    screen.getByText(/^Only clean transactions are counted/),
  ]
  for (let index = 1; index < parts.length; index += 1) {
    expect(follows(parts[index - 1], parts[index])).toBe(true)
  }
  expect(within(region('Key figures')).getAllByRole('term')).toHaveLength(4)
  const slot = container.querySelector('[data-slot="export-action"]')
  expect(slot).toBeInTheDocument()
  expect(
    within(slot as HTMLElement).getByRole('button', { name: 'Export CSV' }),
  ).toBeInTheDocument()
})

it('exports the normalised analytics filters only', async () => {
  const mock = stubStoredSession('user', (request) =>
    new URL(request.url).pathname === '/api/exports'
      ? jsonResponse(202, { id: 'e1' })
      : emptyApi(request),
  )
  renderAt('/analytics?function=mieszkalna&address=Test&exclusion_reason=x&run_id=r1')
  const button = () => screen.getByRole('button', { name: 'Export CSV' })
  // The locked button is replaced by the real one when the session is restored.
  await waitFor(() => expect(button()).not.toHaveAttribute('aria-disabled'))
  await waitFor(() => expect(callsTo(mock, SUMMARY)).toHaveLength(1))

  fireEvent.click(button())

  await waitFor(() => expect(callsTo(mock, '/api/exports')).toHaveLength(1))
  const params = new URL(callsTo(mock, '/api/exports')[0].url).searchParams
  expect([...params.keys()].sort()).toEqual(['date_from', 'date_to', 'function'])
  expect(params.get('function')).toBe('mieszkalna')
  expect(params.get('date_to')).toBe('2026-11-07')
})

it('offers every filter control but Rows and Address', () => {
  stubAnalyticsApi()
  renderAt(`/analytics?${PERIOD}`)
  expect(screen.queryByRole('button', { name: /^Rows/ })).not.toBeInTheDocument()
  expect(screen.queryByRole('textbox', { name: 'Address' })).not.toBeInTheDocument()
  for (const name of ['Territory', 'Date', 'Price (PLN)', 'Area (m²)', 'Rooms', 'Floor']) {
    expect(screen.getByRole('group', { name })).toBeInTheDocument()
  }
  expect(screen.getByRole('combobox', { name: 'Function' })).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'City' })).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'District' })).toBeInTheDocument()
})

it('starts a fresh visit with the default period and a removable function chip', async () => {
  const mock = stubAnalyticsApi()
  const { router } = renderAt('/analytics')
  const chips = region('Active filters')
  expect(await within(chips).findByText('Function: Residential')).toBeInTheDocument()
  expect(within(chips).getByText(/^Date:/)).toBeInTheDocument()
  await waitFor(() => expect(callsTo(mock, SUMMARY)).toHaveLength(1))
  expect(new URL(callsTo(mock, SUMMARY)[0].url).searchParams.get('function')).toBe('mieszkalna')

  fireEvent.click(within(chips).getByRole('button', { name: 'Remove Function: Residential' }))
  await waitFor(() =>
    expect(router.state.location.search).toBe('?date_from=2025-11-07&date_to=2026-11-07'),
  )
  await waitFor(() => expect(callsTo(mock, SUMMARY)).toHaveLength(2))
  expect(new URL(callsTo(mock, SUMMARY)[1].url).searchParams.has('function')).toBe(false)
  expect(within(chips).queryByText('Function: Residential')).not.toBeInTheDocument()
})

it('shows a skeleton in each section while loading', () => {
  const held = deferred<Response>()
  stubAnalyticsApi({ summary: () => held.promise, timeseries: () => held.promise })
  renderAt(`/analytics?${PERIOD}`)
  for (const name of ['Key figures', 'Price per m² by month', 'By rooms', 'By floor']) {
    expect(within(region(name)).getByRole('status')).toHaveTextContent('Loading')
    expect(within(region(name)).queryByRole('img')).not.toBeInTheDocument()
  }
  expect(within(region('Key figures')).queryByRole('term')).not.toBeInTheDocument()
})

it('shows "No data for this period" for an empty summary', async () => {
  stubAnalyticsApi({
    summary: () =>
      jsonResponse(
        200,
        summaryResponse({
          median: null,
          count: 0,
          previous_median: null,
          change_pct: null,
          rooms: [],
          floors: [],
        }),
      ),
  })
  renderAt(`/analytics?${PERIOD}`)
  for (const name of ['Key figures', 'By rooms', 'By floor']) {
    expect(await within(region(name)).findByText('No data for this period')).toBeInTheDocument()
  }
  expect(within(region('Key figures')).queryByRole('term')).not.toBeInTheDocument()
  expect(await within(region('Price per m² by month')).findByRole('img')).toBeInTheDocument()
})

it('keeps the loaded sections when only the timeseries fails', async () => {
  stubAnalyticsApi({ timeseries: () => jsonResponse(500, { detail: 'Boom' }) })
  renderAt(`/analytics?${PERIOD}`)
  const trend = region('Price per m² by month')
  expect(await within(trend).findByRole('alert')).toHaveTextContent(
    /Could not load the monthly prices/,
  )
  expect(within(trend).getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  expect(within(region('Key figures')).getByText('11,000 PLN/m²')).toBeInTheDocument()
  expect(within(region('By rooms')).getByRole('img')).toBeInTheDocument()
  expect(within(region('By floor')).getByRole('img')).toBeInTheDocument()
})

it('retries only the failed summary and then shows the KPIs and distributions', async () => {
  let fail = true
  const mock = stubAnalyticsApi({
    summary: () =>
      fail ? jsonResponse(500, { detail: 'Boom' }) : jsonResponse(200, summaryResponse()),
  })
  renderAt(`/analytics?${PERIOD}`)
  const kpis = region('Key figures')
  await within(kpis).findByRole('alert')
  expect(within(region('By rooms')).getByRole('alert')).toBeInTheDocument()
  await within(region('Price per m² by month')).findByRole('img')
  fail = false
  fireEvent.click(within(kpis).getByRole('button', { name: 'Retry' }))
  expect(await within(kpis).findByText('11,000 PLN/m²')).toBeInTheDocument()
  expect(await within(region('By rooms')).findByRole('img')).toBeInTheDocument()
  expect(within(region('By floor')).getByRole('img')).toBeInTheDocument()
  expect(callsTo(mock, SUMMARY)).toHaveLength(2)
  expect(callsTo(mock, TIMESERIES)).toHaveLength(1)
})

it('requests both endpoints again after a new search', async () => {
  const mock = stubAnalyticsApi()
  renderAt(`/analytics?${PERIOD}`)
  await within(region('Key figures')).findByText('11,000 PLN/m²')
  fireEvent.change(screen.getByRole('textbox', { name: 'City' }), {
    target: { value: 'Kraków' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Search' }))
  await waitFor(() => expect(callsTo(mock, SUMMARY)).toHaveLength(2))
  await waitFor(() => expect(callsTo(mock, TIMESERIES)).toHaveLength(2))
  for (const path of [SUMMARY, TIMESERIES]) {
    const params = new URL(callsTo(mock, path)[1].url).searchParams
    expect(params.get('city_name')).toBe('Kraków')
    expect(params.get('date_from')).toBe('2025-01-01')
  }
})

it('moves focus to the "From" input on "Custom" and keeps the period', async () => {
  stubAnalyticsApi()
  const { router } = renderAt(`/analytics?date_from=2026-08-07&date_to=2026-11-07`)
  expect(screen.getByRole('button', { name: '3 months' })).toHaveAttribute('aria-pressed', 'true')
  act(() => screen.getByRole('button', { name: 'Custom' }).click())
  expect(screen.getByLabelText('From date')).toHaveFocus()
  expect(router.state.location.search).toBe('?date_from=2026-08-07&date_to=2026-11-07')
})
