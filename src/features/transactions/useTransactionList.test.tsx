import { act, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { expect, it } from 'vitest'
import { callsTo, jsonResponse } from '../../test/http'
import { renderWithRouter } from '../../test/render'
import { stubApi, transactionPage, transactionRow } from '../../test/transactions'
import { useFilters, type FiltersApi } from '../filters/useFilters'
import { PAGE_SIZE } from './listQuery'
import { useSort } from './useSort'
import { useTransactionList } from './useTransactionList'

let list: ReturnType<typeof useTransactionList>
let filtersApi: FiltersApi

function Probe() {
  const filters = useFilters()
  const { sort } = useSort()
  const result = useTransactionList(filters.filters, sort)
  useEffect(() => {
    list = result
    filtersApi = filters
  })
  return null
}

/** Query params of a request as sorted [key, value] pairs. */
function paramsOf(request: Request) {
  return [...new URL(request.url).searchParams].sort()
}

const fullPage = () => [
  ...transactionPage(PAGE_SIZE - 1),
  transactionRow({ id: PAGE_SIZE, transaction_date: '2023-01-02' }),
]

it('requests the first page once with filters, sort and limit', async () => {
  const mock = stubApi({ transactions: () => jsonResponse(200, transactionPage(3)) })
  renderWithRouter(<Probe />, { path: '/?rooms=2&sort=price_premises&order=asc' })
  await waitFor(() => expect(list.rows).toHaveLength(3))
  const calls = callsTo(mock, '/api/transactions')
  expect(calls).toHaveLength(1)
  expect(paramsOf(calls[0])).toEqual([
    ['limit', '50'],
    ['order', 'asc'],
    ['rooms', '2'],
    ['sort', 'price_premises'],
  ])
  expect(list.page).toBe(1)
  expect(list.hasNext).toBe(false)
})

it('shows only the next page, requested with the cursor of the last row', async () => {
  const mock = stubApi({
    transactions: (request) =>
      new URL(request.url).searchParams.has('after_id')
        ? jsonResponse(200, transactionPage(5, 101))
        : jsonResponse(200, fullPage()),
  })
  renderWithRouter(<Probe />)
  await waitFor(() => expect(list.hasNext).toBe(true))
  act(() => list.goNext())
  await waitFor(() => expect(list.page).toBe(2))
  await waitFor(() => expect(list.rows).toHaveLength(5))
  const calls = callsTo(mock, '/api/transactions')
  expect(calls).toHaveLength(2)
  const next = new URL(calls[1].url).searchParams
  expect(next.get('after_id')).toBe(String(PAGE_SIZE))
  expect(next.get('after_value')).toBe('2023-01-02')
  expect(next.get('sort')).toBe('transaction_date')
  expect(list.hasNext).toBe(false)
})

it('goes back with Previous and First page', async () => {
  stubApi({ transactions: () => jsonResponse(200, fullPage()) })
  renderWithRouter(<Probe />)
  await waitFor(() => expect(list.hasNext).toBe(true))
  act(() => list.goNext())
  await waitFor(() => expect(list.page).toBe(2))
  await waitFor(() => expect(list.hasNext).toBe(true))
  act(() => list.goNext())
  await waitFor(() => expect(list.page).toBe(3))
  act(() => list.goPrevious())
  await waitFor(() => expect(list.page).toBe(2))
  act(() => list.goFirst())
  await waitFor(() => expect(list.page).toBe(1))
})

it('starts at page 1 when a filter changes', async () => {
  const mock = stubApi({ transactions: () => jsonResponse(200, fullPage()) })
  renderWithRouter(<Probe />)
  await waitFor(() => expect(list.hasNext).toBe(true))
  act(() => list.goNext())
  await waitFor(() => expect(list.page).toBe(2))
  act(() => filtersApi.updateFilters({ rooms: [3] }, { history: 'push' }))
  await waitFor(() => expect(list.page).toBe(1))
  await waitFor(() => {
    const last = callsTo(mock, '/api/transactions').at(-1)
    expect(last && new URL(last.url).searchParams.get('rooms')).toBe('3')
  })
  const last = new URL(callsTo(mock, '/api/transactions').at(-1)!.url).searchParams
  expect(last.has('after_id')).toBe(false)
})

it('keeps the page when the entry is restored after Back', async () => {
  stubApi({ transactions: () => jsonResponse(200, fullPage()) })
  const { router } = renderWithRouter(<Probe />)
  await waitFor(() => expect(list.hasNext).toBe(true))
  act(() => list.goNext())
  await waitFor(() => expect(list.page).toBe(2))
  await act(() => router.navigate('/transactions/7'))
  await act(() => router.navigate(-1))
  await waitFor(() => expect(list.page).toBe(2))
})
