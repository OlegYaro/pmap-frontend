import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetTokensForTests } from '../auth/tokens'
import { adminApi } from '../test/admin'
import { emptyApi } from '../test/analytics'
import { REFRESH_TOKEN_KEY, stubStoredSession } from '../test/auth'
import { deferred, jsonResponse, stubFetch } from '../test/http'
import { renderRoutes } from '../test/render'
import { stubApi, transactionRow } from '../test/transactions'

function renderAt(path: string) {
  renderRoutes(path)
}

beforeEach(() => {
  resetTokensForTests()
  sessionStorage.clear()
  localStorage.clear()
  stubFetch(emptyApi)
})

it('renders /analytics with its sections', async () => {
  renderAt('/analytics')
  expect(screen.getByRole('heading', { level: 1, name: 'Analytics' })).toBeInTheDocument()
  for (const name of ['Key figures', 'Price per m² by month', 'By rooms', 'By floor']) {
    expect(screen.getByRole('region', { name })).toBeInTheDocument()
  }
  expect(
    await within(screen.getByRole('region', { name: 'Key figures' })).findByText(
      'No data for this period',
    ),
  ).toBeInTheDocument()
})

it('renders the home route', async () => {
  renderAt('/')
  expect(screen.getByRole('heading', { name: 'Transactions' })).toBeInTheDocument()
  await screen.findByText('No transactions match these filters')
  expect(document.title).toBe('Transactions · PMAP')
})

it('requests the transaction of the detail page and shows its id', async () => {
  stubApi({ transaction: () => jsonResponse(200, transactionRow({ id: 42 })) })
  renderAt('/transactions/42')
  expect(await screen.findByRole('heading', { name: 'Transaction 42' })).toBeInTheDocument()
  expect(document.title).toBe('Transaction 42 · PMAP')
})

it('opens the detail page from a list row and comes back with the same filters', async () => {
  stubApi({
    transactions: () => jsonResponse(200, [transactionRow({ id: 42 })]),
    transaction: () => jsonResponse(200, transactionRow({ id: 42 })),
  })
  const { router } = renderRoutes('/?rooms=2')
  const table = await screen.findByRole('table')
  fireEvent.click(within(table).getAllByRole('row')[1])
  expect(await screen.findByRole('heading', { name: 'Transaction 42' })).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/transactions/42')
  await act(() => router.navigate(-1))
  expect(router.state.location.pathname).toBe('/')
  expect(router.state.location.search).toBe('?rooms=2')
  await waitFor(() =>
    expect(screen.getByRole('heading', { name: 'Transactions' })).toBeInTheDocument(),
  )
})

it('renders /admin for an admin with the admin tabs', async () => {
  stubStoredSession('admin', adminApi())
  renderAt('/admin')
  expect(await screen.findByRole('heading', { level: 1, name: 'Admin' })).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
  expect(document.title).toBe('Admin · PMAP')
  expect(screen.getByRole('tab', { name: 'Runs' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tab', { name: 'Transactions' })).toBeInTheDocument()
  expect(
    await screen.findByRole('button', { name: 'Details for run 1a2b3c4d' }),
  ).toBeInTheDocument()
})

it.each(['/login', '/transactions'])('shows not-found for the removed route %s', (path) => {
  renderAt(path)
  expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
})

it('shows not-found inside the layout with a link home', () => {
  renderAt('/does-not-exist')
  expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
  expect(screen.getByText('This page does not exist.')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /back to the home page/i })).toHaveAttribute('href', '/')
  expect(document.title).toBe('Page not found · PMAP')
})

it('marks Transactions as current on the home route only', async () => {
  renderAt('/')
  await screen.findByText('No transactions match these filters')
  expect(screen.getByRole('link', { name: 'Transactions' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'Analytics' })).not.toHaveAttribute('aria-current')
})

it('navigates by link and marks the current one', async () => {
  renderAt('/')
  await screen.findByText('No transactions match these filters')
  fireEvent.click(screen.getByRole('link', { name: 'Analytics' }))
  expect(screen.getByRole('heading', { name: 'Analytics' })).toBeInTheDocument()
  expect(document.title).toBe('Analytics · PMAP')
  expect(screen.getByRole('link', { name: 'Analytics' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'Transactions' })).not.toHaveAttribute('aria-current')
})

describe('Admin link', () => {
  const nav = () => screen.getByRole('navigation', { name: 'Main' })

  it('is not offered to anonymous users', async () => {
    renderAt('/analytics')
    await screen.findByRole('button', { name: 'Log in' })
    expect(within(nav()).queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
    expect(within(nav()).getAllByRole('link')).toHaveLength(2)
  })

  it('is not offered while the session is restoring', () => {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, 'R1')
    const held = deferred<Response>()
    stubFetch(() => held.promise)
    renderAt('/analytics')
    expect(within(nav()).queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
  })

  it('is not offered to a regular user', async () => {
    stubStoredSession('user', emptyApi)
    renderAt('/analytics')
    await screen.findByRole('button', { name: 'User 1' })
    expect(within(nav()).queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
  })

  it('is offered to an admin', async () => {
    stubStoredSession('admin', emptyApi)
    renderAt('/analytics')
    expect(await within(nav()).findByRole('link', { name: 'Admin' })).toHaveAttribute(
      'href',
      '/admin',
    )
  })
})

it('shows the "Log in" button before the theme toggle', async () => {
  renderAt('/analytics')
  const login = await screen.findByRole('button', { name: 'Log in' })
  const theme = screen.getByRole('button', { name: 'Theme' })
  expect(login.compareDocumentPosition(theme) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})

it('has the brand link home and the theme toggle in the header', () => {
  renderAt('/analytics')
  expect(screen.getByRole('link', { name: 'PMAP' })).toHaveAttribute('href', '/')
  expect(screen.getByRole('button', { name: 'Theme' })).toBeInTheDocument()
})
