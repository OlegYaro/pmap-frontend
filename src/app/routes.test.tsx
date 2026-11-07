import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetTokensForTests } from '../auth/tokens'
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
  stubFetch(() => jsonResponse(200, []))
})

it('renders /analytics', () => {
  renderAt('/analytics')
  expect(screen.getByRole('heading', { name: 'Analytics' })).toBeInTheDocument()
})

it('renders the home route', async () => {
  renderAt('/')
  expect(screen.getByRole('heading', { name: 'Transactions' })).toBeInTheDocument()
  await screen.findByText('No transactions match these filters')
})

it('requests the transaction of the detail page and shows its id', async () => {
  stubApi({ transaction: () => jsonResponse(200, transactionRow({ id: 42 })) })
  renderAt('/transactions/42')
  expect(await screen.findByRole('heading', { name: 'Transaction 42' })).toBeInTheDocument()
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

it.each(['/login', '/transactions'])('shows not-found for the removed route %s', (path) => {
  renderAt(path)
  expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
})

it('shows not-found inside the layout with a link home', () => {
  renderAt('/does-not-exist')
  expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /back to the home page/i })).toHaveAttribute('href', '/')
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
    stubStoredSession('user')
    renderAt('/analytics')
    await screen.findByRole('button', { name: 'User 1' })
    expect(within(nav()).queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
  })

  it('is offered to an admin', async () => {
    stubStoredSession('admin')
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
