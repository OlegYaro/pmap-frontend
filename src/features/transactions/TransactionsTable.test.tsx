import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { transactionRow } from '../../test/transactions'
import type { TransactionRow } from './listQuery'
import { DEFAULT_SORT, type ListSort } from './sort'
import { TransactionsTable } from './TransactionsTable'

const HEADERS = [
  'Date',
  'Address',
  'City',
  'District',
  'Price',
  'Area',
  'Price/m²',
  'Rooms',
  'Floor',
  'Market',
  'Status',
]

function renderTable(rows: TransactionRow[], sort: ListSort = DEFAULT_SORT) {
  const onSortChange = vi.fn()
  const onOpen = vi.fn()
  render(<TransactionsTable rows={rows} sort={sort} onSortChange={onSortChange} onOpen={onOpen} />)
  return { onSortChange, onOpen }
}

/** The text of each cell of the body row at `index`. */
function cellTexts(index: number) {
  const row = screen.getAllByRole('row')[index + 1]
  return within(row)
    .getAllByRole('cell')
    .map((cell) => cell.textContent)
}

it('has the eleven column headers in order', () => {
  renderTable([transactionRow()])
  expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(HEADERS)
})

it('formats a row', () => {
  renderTable([
    transactionRow({
      transaction_date: '2024-12-31',
      address: 'ul. Długa 5',
      city_name: 'Gdańsk',
      district_name: 'Śródmieście',
      price_premises: 500000,
      area_usable: 40,
      rooms: 2,
      floor: 0,
      market_type: 'wtorny',
    }),
  ])
  expect(cellTexts(0)).toEqual([
    '12/31/2024',
    'ul. Długa 5',
    'Gdańsk',
    'Śródmieście',
    '500,000 PLN',
    '40 m²',
    '12,500 PLN',
    '2',
    '0',
    'Secondary',
    'Clean',
  ])
})

it('shows a dash for missing values and the raw market type when unknown', () => {
  renderTable([
    transactionRow({ address: null, district_name: null, rooms: null, market_type: null }),
    transactionRow({ id: 2, market_type: 'nowy' }),
  ])
  const [, address, , district, , , , rooms, , market] = cellTexts(0)
  expect([address, district, rooms, market]).toEqual(['—', '—', '—', '—'])
  expect(cellTexts(1)[9]).toBe('nowy')
})

it('computes the price per m² and shows a dash without an area', () => {
  renderTable([
    transactionRow({ price_premises: 455000, area_usable: 38.5 }),
    transactionRow({ id: 2, price_premises: 455000, area_usable: null }),
  ])
  expect(cellTexts(0)[6]).toBe('11,818 PLN')
  expect(cellTexts(1)[6]).toBe('—')
})

it('shows the status as a badge that differs for clean and excluded rows', () => {
  renderTable([
    transactionRow({ id: 1, exclusion_reason: null }),
    transactionRow({ id: 2, exclusion_reason: 'package_deal' }),
    transactionRow({ id: 3, exclusion_reason: 'duplicate' }),
  ])
  expect(screen.getByText('Clean')).toHaveAttribute('data-status', 'clean')
  expect(screen.getByText('Package deal')).toHaveAttribute('data-status', 'excluded')
  expect(screen.getByText('duplicate')).toHaveAttribute('data-status', 'excluded')
})

it('offers sorting on the nine server-sortable columns only', () => {
  renderTable([transactionRow()])
  const buttons = within(screen.getAllByRole('row')[0]).getAllByRole('button')
  expect(buttons.map((button) => button.textContent)).toEqual(
    HEADERS.filter((header) => header !== 'Price/m²' && header !== 'Status'),
  )
  expect(screen.queryByRole('button', { name: 'Price/m²' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Status' })).not.toBeInTheDocument()
})

it('marks the default sorted column', () => {
  renderTable([transactionRow()])
  const sorted = screen.getAllByRole('columnheader').filter((h) => h.hasAttribute('aria-sort'))
  expect(sorted).toHaveLength(1)
  expect(sorted[0]).toHaveTextContent('Date')
  expect(sorted[0]).toHaveAttribute('aria-sort', 'descending')
})

it('marks an ascending column', () => {
  renderTable([transactionRow()], { field: 'price_premises', order: 'asc' })
  expect(screen.getByRole('columnheader', { name: 'Price' })).toHaveAttribute(
    'aria-sort',
    'ascending',
  )
})

it('marks no column for a sort field without a column', () => {
  renderTable([transactionRow()], { field: 'updated_at', order: 'desc' })
  const sorted = screen.getAllByRole('columnheader').filter((h) => h.hasAttribute('aria-sort'))
  expect(sorted).toHaveLength(0)
})

it('flips the direction of the sorted column', () => {
  const { onSortChange } = renderTable([transactionRow()])
  fireEvent.click(screen.getByRole('button', { name: 'Date' }))
  expect(onSortChange).toHaveBeenCalledWith({ field: 'transaction_date', order: 'asc' })
})

it('sorts another column ascending', () => {
  const { onSortChange } = renderTable([transactionRow()])
  fireEvent.click(screen.getByRole('button', { name: 'Price' }))
  expect(onSortChange).toHaveBeenCalledWith({ field: 'price_premises', order: 'asc' })
})

it('opens a row by click and by Enter', () => {
  const { onOpen } = renderTable([transactionRow({ id: 42 })])
  const row = screen.getAllByRole('row')[1]
  expect(row).toHaveAttribute('tabindex', '0')
  fireEvent.click(row)
  expect(onOpen).toHaveBeenLastCalledWith(42)
  fireEvent.keyDown(row, { key: 'Enter' })
  expect(onOpen).toHaveBeenCalledTimes(2)
  fireEvent.keyDown(row, { key: ' ' })
  expect(onOpen).toHaveBeenCalledTimes(2)
})

it('shows the readable market type for both stored spellings', () => {
  renderTable([
    transactionRow({ id: 1, market_type: 'wtorny' }),
    transactionRow({ id: 2, market_type: 'rynekWtorny' }),
    transactionRow({ id: 3, market_type: 'rynekPierwotny' }),
  ])
  expect(cellTexts(0)[9]).toBe('Secondary')
  expect(cellTexts(1)[9]).toBe('Secondary')
  expect(cellTexts(2)[9]).toBe('Primary')
})
