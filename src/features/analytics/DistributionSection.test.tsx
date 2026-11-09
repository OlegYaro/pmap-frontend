import { fireEvent, screen, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { stubAnalyticsApi, summaryResponse } from '../../test/analytics'
import { jsonResponse } from '../../test/http'
import { renderWithRouter } from '../../test/render'
import { DistributionSection } from './DistributionSection'
import type { DistributionItem } from './distribution'
import { useSummary, type Summary } from './useAnalyticsData'

// Stands in for the Recharts chart: its accessible label and the bars as "group: count" items.
vi.mock('./AnalyticsCharts', async () => {
  const { distributionDescription } = await import('./distribution')
  return {
    TrendChart: () => null,
    DistributionChart: ({ title, items }: { title: string; items: DistributionItem[] }) => (
      <ul role="img" aria-label={distributionDescription(title, items)}>
        {items.map((item) => (
          <li key={item.group}>{`${item.group}: ${item.count}`}</li>
        ))}
      </ul>
    ),
  }
})

const selectRooms = (summary: Summary) => summary.rooms
const selectFloors = (summary: Summary) => summary.floors

function Sections() {
  const query = useSummary({ date_from: '2025-01-01', date_to: '2025-12-31' }, true)
  return (
    <>
      <DistributionSection title="By rooms" query={query} select={selectRooms} />
      <DistributionSection title="By floor" query={query} select={selectFloors} />
    </>
  )
}

const section = (name: string) => screen.getByRole('region', { name })
const bars = (name: string) =>
  within(within(section(name)).getByRole('img'))
    .getAllByRole('listitem')
    .map((item) => item.textContent)
const tableRows = (name: string) =>
  within(section(name))
    .getAllByRole('row')
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    )

async function renderSections(summary: Summary = summaryResponse()) {
  const mock = stubAnalyticsApi({ summary: () => jsonResponse(200, summary) })
  renderWithRouter(<Sections />)
  await within(section('By rooms')).findByRole('img')
  return mock
}

it('shows the bars in group order with "Unknown" last', async () => {
  await renderSections()
  expect(bars('By rooms')).toEqual(['1: 5', '3: 15', 'Unknown: 2'])
  expect(bars('By floor')).toEqual(['0: 6', '2: 20', '10: 4'])
  expect(within(section('By rooms')).getByRole('img')).toHaveAccessibleName(
    'Transactions by rooms, 3 groups, largest: 3 with 15 transactions',
  )
})

it('switches one section to its table and leaves the other on the chart', async () => {
  await renderSections()
  const rooms = section('By rooms')
  expect(within(rooms).getByRole('button', { name: 'Chart' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  fireEvent.click(within(rooms).getByRole('button', { name: 'Table' }))
  expect(within(rooms).getByRole('button', { name: 'Table' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(within(rooms).queryByRole('img')).not.toBeInTheDocument()
  expect(tableRows('By rooms')).toEqual([
    ['1', '5'],
    ['3', '15'],
    ['Unknown', '2'],
  ])
  expect(within(section('By floor')).getByRole('img')).toBeInTheDocument()
  expect(within(section('By floor')).queryByRole('table')).not.toBeInTheDocument()
})

it('sorts by count descending on the second activation, without a request', async () => {
  const mock = await renderSections()
  const requests = mock.mock.calls.length
  const rooms = section('By rooms')
  fireEvent.click(within(rooms).getByRole('button', { name: 'Table' }))
  const header = () => within(rooms).getByRole('columnheader', { name: 'Transactions' })
  expect(header()).not.toHaveAttribute('aria-sort')
  fireEvent.click(within(header()).getByRole('button'))
  expect(header()).toHaveAttribute('aria-sort', 'ascending')
  expect(tableRows('By rooms')).toEqual([
    ['Unknown', '2'],
    ['1', '5'],
    ['3', '15'],
  ])
  fireEvent.click(within(header()).getByRole('button'))
  expect(header()).toHaveAttribute('aria-sort', 'descending')
  expect(tableRows('By rooms')).toEqual([
    ['3', '15'],
    ['1', '5'],
    ['Unknown', '2'],
  ])
  expect(within(rooms).getByRole('columnheader', { name: 'Group' })).not.toHaveAttribute(
    'aria-sort',
  )
  expect(mock.mock.calls.length).toBe(requests)
})

it('sorts by group descending with "Unknown" first', async () => {
  await renderSections()
  const rooms = section('By rooms')
  fireEvent.click(within(rooms).getByRole('button', { name: 'Table' }))
  const button = within(within(rooms).getByRole('columnheader', { name: 'Group' })).getByRole(
    'button',
  )
  fireEvent.click(button)
  fireEvent.click(button)
  expect(tableRows('By rooms').map(([group]) => group)).toEqual(['Unknown', '3', '1'])
  fireEvent.click(button)
  expect(tableRows('By rooms').map(([group]) => group)).toEqual(['1', '3', 'Unknown'])
})

it('shows "No data for this period" without a toggle for an empty distribution', async () => {
  await renderSections(summaryResponse({ floors: [] }))
  const floors = section('By floor')
  expect(within(floors).getByText('No data for this period')).toBeInTheDocument()
  expect(within(floors).queryByRole('button')).not.toBeInTheDocument()
  expect(within(floors).queryByRole('img')).not.toBeInTheDocument()
  expect(within(section('By rooms')).getByRole('img')).toBeInTheDocument()
})

it('shows the summary error with a retry in each section', async () => {
  stubAnalyticsApi({ summary: () => jsonResponse(500, { detail: 'Boom' }) })
  renderWithRouter(<Sections />)
  expect(await within(section('By rooms')).findByRole('alert')).toHaveTextContent(
    /Could not load the summary/,
  )
  expect(within(section('By floor')).getByRole('button', { name: 'Retry' })).toBeInTheDocument()
})
