import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { callsTo, deferred, jsonResponse } from '../../test/http'
import { renderRoutes } from '../../test/render'
import { stubApi, transactionPage, transactionRow } from '../../test/transactions'

const detail = (overrides: Parameters<typeof transactionRow>[0] = {}) =>
  stubApi({ transaction: () => jsonResponse(200, transactionRow({ id: 42, ...overrides })) })

it('requests the transaction of the URL and shows header, status and groups', async () => {
  const mock = detail({ address: 'ul. Marszałkowska 1' })
  renderRoutes('/transactions/42')
  expect(await screen.findAllByText('ul. Marszałkowska 1')).toHaveLength(2)
  expect(screen.getByRole('heading', { name: 'Transaction 42' })).toBeInTheDocument()
  expect(screen.getByText('Clean')).toBeInTheDocument()
  expect(callsTo(mock, '/api/transactions/42')).toHaveLength(1)
  for (const group of ['Prices', 'Premises', 'Location', 'Source']) {
    expect(screen.getByRole('region', { name: group })).toBeInTheDocument()
  }
})

it('shows the three price levels and the price per m2', async () => {
  detail({
    price_premises: 500000,
    price_property: 520000,
    price_transaction: 600000,
    area_usable: 40,
  })
  renderRoutes('/transactions/42')
  const prices = within(await screen.findByRole('region', { name: 'Prices' }))
  expect(prices.getByText('500,000 PLN')).toBeInTheDocument()
  expect(prices.getByText('520,000 PLN')).toBeInTheDocument()
  expect(prices.getByText('600,000 PLN')).toBeInTheDocument()
  expect(prices.getByText('12,500 PLN')).toBeInTheDocument()
})

it('shows a dash for missing values and the name with the code for territories', async () => {
  detail({
    rooms: null,
    district_name: null,
    price_property: null,
    powiat_code: '1465',
    gmina_code: '1465011',
  })
  renderRoutes('/transactions/42')
  const premises = within(await screen.findByRole('region', { name: 'Premises' }))
  expect(premises.getByText('Rooms').nextElementSibling).toHaveTextContent('—')
  const location = within(screen.getByRole('region', { name: 'Location' }))
  expect(location.getByText('District').nextElementSibling).toHaveTextContent('—')
  expect(
    within(screen.getByRole('region', { name: 'Prices' })).getByText('Property price')
      .nextElementSibling,
  ).toHaveTextContent('—')
  await waitFor(() =>
    expect(location.getByText('Powiat').nextElementSibling).toHaveTextContent('Warszawa (1465)'),
  )
  expect(location.getByText('Gmina').nextElementSibling).toHaveTextContent('Warszawa (1465011)')
})

it('shows the readable exclusion reason', async () => {
  detail({ exclusion_reason: 'package_deal' })
  renderRoutes('/transactions/42')
  expect(await screen.findByText('Package deal')).toBeInTheDocument()
})

it('lists source attributes collapsed and shows null as a dash', async () => {
  detail({ attributes: { tran_rodzaj_trans: 'wolnyRynek', lok_vat: null } })
  renderRoutes('/transactions/42')
  const summary = await screen.findByText('Source attributes')
  const details = summary.closest('details')!
  expect(details).not.toHaveAttribute('open')
  fireEvent.click(summary)
  expect(details).toHaveAttribute('open')
  expect(within(details).getByText('tran_rodzaj_trans').nextElementSibling).toHaveTextContent(
    'wolnyRynek',
  )
  expect(within(details).getByText('lok_vat').nextElementSibling).toHaveTextContent('—')
})

it('says there are no attributes and marks manual records', async () => {
  detail({ attributes: {} })
  renderRoutes('/transactions/42')
  fireEvent.click(await screen.findByText('Source attributes'))
  expect(screen.getByText('No attributes')).toBeInTheDocument()
  expect(screen.queryByText('Manual')).not.toBeInTheDocument()
})

it('shows a Manual badge for a hand-entered record', async () => {
  detail({ attributes: { source: 'manual' } })
  renderRoutes('/transactions/42')
  expect(await screen.findByText('Manual')).toBeInTheDocument()
})

it('shows a loading status before the response', async () => {
  const held = deferred<Response>()
  stubApi({ transaction: () => held.promise })
  renderRoutes('/transactions/42')
  expect(await screen.findByRole('status')).toHaveTextContent('Loading')
  expect(screen.queryByRole('region', { name: 'Prices' })).not.toBeInTheDocument()
  held.resolve(jsonResponse(200, transactionRow({ id: 42 })))
  expect(await screen.findByRole('region', { name: 'Prices' })).toBeInTheDocument()
})

it('shows not found for a 404', async () => {
  stubApi({ transaction: () => jsonResponse(404, { detail: 'Not found' }) })
  renderRoutes('/transactions/999')
  expect(await screen.findByText('Transaction not found')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Go to the transactions' })).toHaveAttribute('href', '/')
})

it('shows not found for a bad id without a request', async () => {
  const mock = stubApi()
  renderRoutes('/transactions/abc')
  expect(await screen.findByText('Transaction not found')).toBeInTheDocument()
  expect(callsTo(mock, '/api/transactions/abc')).toHaveLength(0)
})

it('shows the error and recovers on retry', async () => {
  let fail = true
  stubApi({
    transaction: () =>
      fail
        ? jsonResponse(502, { detail: 'Extraction request failed' })
        : jsonResponse(200, transactionRow({ id: 42 })),
  })
  renderRoutes('/transactions/42')
  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('Extraction request failed')
  fail = false
  fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }))
  expect(await screen.findByRole('region', { name: 'Prices' })).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

it('goes back to the same list page and filters', async () => {
  stubApi({
    transactions: () => jsonResponse(200, transactionPage(50)),
    transaction: () => jsonResponse(200, transactionRow({ id: 42 })),
  })
  const { router } = renderRoutes('/?rooms=2')
  fireEvent.click(await screen.findByRole('button', { name: 'Next' }))
  expect(await screen.findByText(/Page 2/)).toBeInTheDocument()
  fireEvent.click(screen.getAllByRole('row')[1])
  fireEvent.click(await screen.findByRole('button', { name: 'Back to the list' }))
  await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  expect(router.state.location.search).toBe('?rooms=2')
  expect(await screen.findByText(/Page 2/)).toBeInTheDocument()
})

it('links to the list when the page is opened directly', async () => {
  detail()
  renderRoutes('/transactions/42')
  const back = await screen.findByRole('link', { name: 'Back to the list' })
  expect(back).toHaveAttribute('href', '/')
  await act(async () => {})
})
