import { render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { timeseriesPoint } from '../../test/analytics'
import { buildTrend } from './trend'
import { TrendTable } from './TrendTable'

const cellsOf = (row: HTMLElement) =>
  within(row)
    .getAllByRole('cell')
    .map((cell) => cell.textContent)

it('shows one row per month in time order with all columns', () => {
  render(
    <TrendTable
      trend={buildTrend([
        timeseriesPoint({ month: '2025-03-01' }),
        timeseriesPoint({ month: null, count: 99 }),
        timeseriesPoint({ month: '2025-02-01', count: 8, p25: 8900, median: 9800, p75: 10800 }),
      ])}
    />,
  )
  expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
    'Month',
    'Median',
    'P25',
    'P75',
    'Transactions',
  ])
  const rows = screen.getAllByRole('row').slice(1)
  expect(rows.map(cellsOf)).toEqual([
    ['February 2025', '9,800 PLN/m²', '8,900 PLN/m²', '10,800 PLN/m²', '8'],
    ['March 2025', '10,000 PLN/m²', '9,000 PLN/m²', '11,000 PLN/m²', '12'],
  ])
})

it('shows "n/a" for a missing median', () => {
  render(<TrendTable trend={buildTrend([timeseriesPoint({ median: null })])} />)
  const [row] = screen.getAllByRole('row').slice(1)
  expect(cellsOf(row)[1]).toBe('n/a')
})
