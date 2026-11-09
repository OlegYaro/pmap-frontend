import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, expect, it } from 'vitest'
import { stubAdminApi } from '../../test/admin'
import { renderWithRouter } from '../../test/render'
import { AdminPage } from './AdminPage'

function renderPage(path = '/admin') {
  return renderWithRouter(<AdminPage />, { path })
}

beforeEach(() => {
  stubAdminApi()
})

it('shows the heading and selects "Runs" by default', async () => {
  renderPage()
  expect(screen.getByRole('heading', { level: 1, name: 'Admin' })).toBeInTheDocument()
  const tabs = screen.getAllByRole('tab')
  expect(tabs.map((tab) => tab.textContent)).toEqual(['Runs', 'Transactions'])
  expect(screen.getByRole('tab', { name: 'Runs' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tabpanel', { name: 'Runs' })).toBeInTheDocument()
  expect(await screen.findByRole('heading', { name: 'Recent runs' })).toBeInTheDocument()
})

it('opens the tab from the URL', () => {
  renderPage('/admin?tab=transactions')
  expect(screen.getByRole('tab', { name: 'Transactions' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tabpanel', { name: 'Transactions' })).toBeInTheDocument()
  expect(screen.queryByRole('tabpanel', { name: 'Runs' })).not.toBeInTheDocument()
})

it('offers "New transaction" in the transactions panel', () => {
  renderPage('/admin?tab=transactions')
  const panel = screen.getByRole('tabpanel', { name: 'Transactions' })
  expect(within(panel).getByRole('button', { name: 'New transaction' })).toBeInTheDocument()
  expect(panel).not.toHaveTextContent(/not available/)
})

it('selects "Runs" for an unknown tab', () => {
  renderPage('/admin?tab=nope')
  expect(screen.getByRole('tab', { name: 'Runs' })).toHaveAttribute('aria-selected', 'true')
})

it('moves focus and selection with the arrow keys and pushes the tab', async () => {
  const { router } = renderPage()
  const runs = screen.getByRole('tab', { name: 'Runs' })
  runs.focus()
  fireEvent.keyDown(runs, { key: 'ArrowRight' })

  const transactions = screen.getByRole('tab', { name: 'Transactions' })
  await waitFor(() => expect(transactions).toHaveFocus())
  await waitFor(() => expect(transactions).toHaveAttribute('aria-selected', 'true'))
  expect(router.state.location.search).toBe('?tab=transactions')
  expect(router.state.historyAction).toBe('PUSH')
})

it('switches tabs with the pointer', () => {
  const { router } = renderPage()
  fireEvent.mouseDown(screen.getByRole('tab', { name: 'Transactions' }), { button: 0 })
  expect(router.state.location.search).toBe('?tab=transactions')
  expect(screen.getByRole('tabpanel', { name: 'Transactions' })).toBeInTheDocument()
})
