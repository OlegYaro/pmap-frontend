import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { callsTo, deferred, jsonResponse } from '../../test/http'
import { renderWithRouter } from '../../test/render'
import { stubApi, transactionPage, transactionRow } from '../../test/transactions'
import { PAGE_SIZE } from './listQuery'
import { TransactionsPage } from './TransactionsPage'

function renderAt(path: string) {
  return renderWithRouter(<TransactionsPage />, { path })
}

/** Query params of a request as sorted [key, value] pairs. */
function paramsOf(request: Request) {
  return [...new URL(request.url).searchParams].sort()
}

const listCalls = (mock: ReturnType<typeof stubApi>) => callsTo(mock, '/api/transactions')
const bodyRows = () => screen.getAllByRole('row').slice(1)

/** A handler that answers the first page with `first` and every later page with `next`. */
function pages(first: unknown[], next: () => Response | Promise<Response>) {
  return (request: Request) =>
    new URL(request.url).searchParams.has('after_id') ? next() : jsonResponse(200, first)
}

it('shows the header, filters, chips and table in order with an empty export slot', async () => {
  stubApi({ transactions: () => jsonResponse(200, transactionPage(3)) })
  const { container } = renderAt('/')
  await screen.findByRole('table')
  const heading = screen.getByRole('heading', { level: 1, name: 'Transactions' })
  const address = screen.getByLabelText('Address')
  const chips = screen.getByRole('region', { name: 'Active filters' })
  const table = screen.getByRole('table')
  const follows = (a: Node, b: Node) =>
    Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
  expect(follows(heading, address)).toBe(true)
  expect(follows(address, chips)).toBe(true)
  expect(follows(chips, table)).toBe(true)
  const slot = container.querySelector('[data-slot="export-action"]')
  expect(slot).toBeInTheDocument()
  expect(slot).toBeEmptyDOMElement()
})

it('requests the filters and sort from the URL', async () => {
  const mock = stubApi()
  renderAt('/?powiat_code=0264&rooms=2&rooms=3&sort=price_premises&order=asc')
  await screen.findByText('No transactions match these filters')
  expect(listCalls(mock)).toHaveLength(1)
  expect(paramsOf(listCalls(mock)[0])).toEqual([
    ['limit', '50'],
    ['order', 'asc'],
    ['powiat_code', '0264'],
    ['rooms', '2'],
    ['rooms', '3'],
    ['sort', 'price_premises'],
    ['voivodeship_code', '02'],
  ])
})

it('requests the default sort on /', async () => {
  const mock = stubApi()
  renderAt('/')
  await screen.findByText('No transactions match these filters')
  expect(paramsOf(listCalls(mock)[0])).toEqual([
    ['limit', '50'],
    ['order', 'desc'],
    ['sort', 'transaction_date'],
  ])
})

it('shows skeleton rows while the first page loads', async () => {
  const held = deferred<Response>()
  stubApi({ transactions: () => held.promise })
  renderAt('/')
  expect(screen.getByRole('status')).toHaveTextContent('Loading')
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
  expect(screen.queryByText(/loaded$/)).not.toBeInTheDocument()
  held.resolve(jsonResponse(200, transactionPage(2)))
  await screen.findByRole('table')
  expect(bodyRows()).toHaveLength(2)
})

it('sorts by a header click and requests the list again', async () => {
  const mock = stubApi({ transactions: () => jsonResponse(200, transactionPage(3)) })
  const { router } = renderAt('/?city_name=Krak%C3%B3w')
  await screen.findByRole('table')
  fireEvent.click(screen.getByRole('button', { name: 'Price' }))
  await waitFor(() =>
    expect(router.state.location.search).toBe(
      '?city_name=Krak%C3%B3w&sort=price_premises&order=asc',
    ),
  )
  await waitFor(() => expect(listCalls(mock)).toHaveLength(2))
  const second = new URL(listCalls(mock)[1].url).searchParams
  expect(second.get('sort')).toBe('price_premises')
  expect(second.get('order')).toBe('asc')
  expect(await screen.findByRole('columnheader', { name: 'Price' })).toHaveAttribute(
    'aria-sort',
    'ascending',
  )
})

const fullFirstPage = () => [
  ...transactionPage(PAGE_SIZE - 1),
  transactionRow({ id: PAGE_SIZE, transaction_date: '2023-01-02' }),
]

it('shows the next page with the keyset of the last row and its range', async () => {
  const mock = stubApi({
    transactions: pages(fullFirstPage(), () => jsonResponse(200, transactionPage(20, 101))),
  })
  renderAt('/')
  expect(await screen.findByText(/Rows 1–50/)).toBeInTheDocument()
  expect(screen.getByText(/Page 1/)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Previous' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  expect(await screen.findByText(/Rows 51–70/)).toBeInTheDocument()
  expect(screen.getByText(/Page 2/)).toBeInTheDocument()
  expect(bodyRows()).toHaveLength(20)
  const next = new URL(listCalls(mock)[1].url).searchParams
  expect(next.get('after_id')).toBe(String(PAGE_SIZE))
  expect(next.get('after_value')).toBe('2023-01-02')
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
})

it('goes to the previous and to the first page', async () => {
  const mock = stubApi({ transactions: () => jsonResponse(200, fullFirstPage()) })
  renderAt('/')
  fireEvent.click(await screen.findByRole('button', { name: 'Next' }))
  expect(await screen.findByText(/Page 2/)).toBeInTheDocument()
  fireEvent.click(await screen.findByRole('button', { name: 'Next' }))
  expect(await screen.findByText(/Page 3/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
  expect(await screen.findByText(/Page 2/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'First page' }))
  expect(await screen.findByText(/Page 1/)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'First page' })).not.toBeInTheDocument()
  // Going back shows cached pages: nothing is requested again.
  const count = listCalls(mock).length
  expect(count).toBeLessThanOrEqual(3)
  expect(new URL(listCalls(mock)[0].url).searchParams.has('after_id')).toBe(false)
})

it('disables the buttons while a page loads', async () => {
  const held = deferred<Response>()
  const mock = stubApi({ transactions: pages(fullFirstPage(), () => held.promise) })
  renderAt('/')
  const button = await screen.findByRole('button', { name: 'Next' })
  fireEvent.click(button)
  await waitFor(() => expect(button).toBeDisabled())
  fireEvent.click(button)
  expect(listCalls(mock)).toHaveLength(2)
  held.resolve(jsonResponse(200, transactionPage(3, 101)))
  expect(await screen.findByText(/Rows 51–53/)).toBeInTheDocument()
})

it('says there are no more rows after a full page followed by an empty one', async () => {
  stubApi({ transactions: pages(fullFirstPage(), () => jsonResponse(200, [])) })
  renderAt('/')
  fireEvent.click(await screen.findByRole('button', { name: 'Next' }))
  expect(await screen.findByText('No more rows')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled()
  expect(screen.getByRole('button', { name: 'First page' })).toBeEnabled()
})

it('returns to page 1 when a filter chip is removed', async () => {
  const mock = stubApi({ transactions: () => jsonResponse(200, transactionPage(PAGE_SIZE)) })
  const { router } = renderAt('/?rooms=2')
  fireEvent.click(await screen.findByRole('button', { name: 'Next' }))
  expect(await screen.findByText(/Page 2/)).toBeInTheDocument()
  const chips = screen.getByRole('region', { name: 'Active filters' })
  fireEvent.click(within(chips).getByRole('button', { name: /^Remove/ }))
  await waitFor(() => expect(router.state.location.search).toBe(''))
  expect(await screen.findByText(/Page 1/)).toBeInTheDocument()
  const last = new URL(listCalls(mock).at(-1)!.url).searchParams
  expect(last.has('after_id')).toBe(false)
  expect(last.has('rooms')).toBe(false)
})

it('shows the same page after opening a transaction and going Back', async () => {
  stubApi({ transactions: () => jsonResponse(200, fullFirstPage()) })
  const { router } = renderAt('/')
  fireEvent.click(await screen.findByRole('button', { name: 'Next' }))
  expect(await screen.findByText(/Page 2/)).toBeInTheDocument()
  fireEvent.click(bodyRows()[0])
  await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/transactions\//))
  await act(() => router.navigate(-1))
  expect(await screen.findByText(/Page 2/)).toBeInTheDocument()
})

it('keeps the content width: the grid cells can shrink and only the table box scrolls', async () => {
  stubApi({ transactions: () => jsonResponse(200, transactionPage(3)) })
  renderAt('/')
  const table = await screen.findByRole('table')
  const section = screen.getByRole('region', { name: 'Transaction list' })
  expect(section.className).toContain('min-w-0')
  expect(section.className).toContain('minmax(0,1fr)')
  expect(section.parentElement?.className).toContain('minmax(0,1fr)')
  expect(table.parentElement?.className).toContain('overflow-auto')
  expect(table.parentElement?.className).toContain('min-w-0')
})

it('resets the filters from the empty state and keeps the sort', async () => {
  const mock = stubApi()
  const { router } = renderAt('/?city_name=Nowhere&sort=rooms')
  await screen.findByText('No transactions match these filters')
  fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
  await waitFor(() => expect(router.state.location.search).toBe('?sort=rooms'))
  await waitFor(() => expect(listCalls(mock)).toHaveLength(2))
  expect(new URL(listCalls(mock)[1].url).searchParams.has('city_name')).toBe(false)
})

it('offers no reset when no filter is active', async () => {
  stubApi()
  renderAt('/')
  await screen.findByText('No transactions match these filters')
  expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument()
})

it('shows the error and recovers on retry', async () => {
  let fail = true
  stubApi({
    transactions: () =>
      fail ? jsonResponse(422, { detail: 'Invalid sort' }) : jsonResponse(200, transactionPage(2)),
  })
  renderAt('/')
  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('Invalid sort')
  fail = false
  fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }))
  await screen.findByRole('table')
  expect(bodyRows()).toHaveLength(2)
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

it('shows the error of a failed page and retries the same page', async () => {
  let fail = true
  const mock = stubApi({
    transactions: pages(fullFirstPage(), () =>
      fail
        ? jsonResponse(502, { detail: 'Extraction request failed' })
        : jsonResponse(200, transactionPage(10, 101)),
    ),
  })
  renderAt('/')
  fireEvent.click(await screen.findByRole('button', { name: 'Next' }))
  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('Extraction request failed')
  expect(screen.getByRole('button', { name: 'First page' })).toBeInTheDocument()
  fail = false
  fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }))
  expect(await screen.findByText(/Rows 51–60/)).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  const [, failed, retried] = listCalls(mock).map((r) => new URL(r.url).searchParams)
  expect(failed.get('after_id')).toBe(String(PAGE_SIZE))
  expect(retried.get('after_id')).toBe(String(PAGE_SIZE))
})

it('opens the detail route from a row', async () => {
  stubApi({ transactions: () => jsonResponse(200, [transactionRow({ id: 42 })]) })
  const { router } = renderAt('/?rooms=2')
  await screen.findByRole('table')
  fireEvent.click(bodyRows()[0])
  await waitFor(() => expect(router.state.location.pathname).toBe('/transactions/42'))
  expect(router.state.historyAction).toBe('PUSH')
})

it('sends no request for filter edits until "Search" is pressed', async () => {
  const mock = stubApi()
  renderAt('/')
  await screen.findByText('No transactions match these filters')
  expect(listCalls(mock)).toHaveLength(1)
  fireEvent.change(screen.getByLabelText('Address'), { target: { value: 'Mar' } })
  fireEvent.click(screen.getByRole('checkbox', { name: '2 rooms' }))
  await new Promise((resolve) => setTimeout(resolve, 500))
  expect(listCalls(mock)).toHaveLength(1)
  fireEvent.click(screen.getByRole('button', { name: 'Search' }))
  await waitFor(() => expect(listCalls(mock)).toHaveLength(2))
  expect(paramsOf(listCalls(mock)[1])).toEqual(
    expect.arrayContaining([
      ['address', 'Mar'],
      ['rooms', '2'],
    ]),
  )
})
