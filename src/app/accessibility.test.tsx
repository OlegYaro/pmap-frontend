import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, expect, it } from 'vitest'
import { resetTokensForTests } from '../auth/tokens'
import { adminApi } from '../test/admin'
import { emptyApi } from '../test/analytics'
import { stubStoredSession } from '../test/auth'
import { tabOrder } from '../test/focus'
import { stubFetch } from '../test/http'
import { renderRoutes } from '../test/render'
import { stubApi, transactionRow } from '../test/transactions'
import { jsonResponse } from '../test/http'

const INTERACTIVE = 'a[href], button, input, select, textarea, [role="tab"], [role="combobox"]'

/** Every control inside `root` must have an accessible name (buttons with only an icon included). */
function expectNamedControls(root: HTMLElement = document.body) {
  const controls = Array.from(root.querySelectorAll<HTMLElement>(INTERACTIVE)).filter(
    (el) => el.getAttribute('type') !== 'hidden' && !el.closest('[aria-hidden="true"]'),
  )
  expect(controls.length).toBeGreaterThan(0)
  for (const control of controls) expect(control).toHaveAccessibleName()
}

beforeEach(() => {
  resetTokensForTests()
  sessionStorage.clear()
  localStorage.clear()
})

it('orders the header: skip link, brand, navigation, account, theme', async () => {
  stubFetch(emptyApi)
  renderRoutes('/analytics')
  await screen.findByRole('button', { name: 'Log in' })
  const header = screen.getByRole('banner')
  const names = tabOrder()
    .filter((el) => el.closest('header') === header || el.getAttribute('href') === '#main-content')
    .map((el) => el.getAttribute('aria-label') ?? el.textContent)
  expect(names).toEqual([
    'Skip to main content',
    'PMAP',
    'Transactions',
    'Analytics',
    'Log in',
    'Theme',
  ])
})

it('keeps the header controls before the page content in the tab order', async () => {
  stubFetch(emptyApi)
  renderRoutes('/')
  await screen.findByText('No transactions match these filters')
  const order = tabOrder()
  const main = screen.getByRole('main')
  const firstInMain = order.findIndex((el) => main.contains(el))
  const lastInHeader = order.map((el) => !!el.closest('header')).lastIndexOf(true)
  expect(lastInHeader).toBeLessThan(firstInMain)
})

it('gives every control of the transactions page a name', async () => {
  stubApi({ transactions: () => jsonResponse(200, [transactionRow({ id: 42 })]) })
  renderRoutes('/?rooms=2&min_price=100000')
  const table = await screen.findByRole('table')
  expectNamedControls()
  // Rows are reachable by keyboard and sortable headers are buttons.
  expect(within(table).getAllByRole('row')[1]).toHaveAttribute('tabindex', '0')
  expect(screen.getByRole('button', { name: /^Remove / })).toBeInTheDocument()
})

it('gives every control of the analytics page a name', async () => {
  stubFetch(emptyApi)
  renderRoutes('/analytics')
  await screen.findAllByText('No data for this period')
  expectNamedControls()
})

it('gives every control of the admin area a name', async () => {
  stubStoredSession('admin', adminApi())
  renderRoutes('/admin')
  await screen.findByRole('button', { name: 'Details for run 1a2b3c4d' })
  expectNamedControls()
})

it('gives every control of the login dialog a name', async () => {
  stubFetch(emptyApi)
  renderRoutes('/analytics')
  fireEvent.click(await screen.findByRole('button', { name: 'Log in' }))
  expectNamedControls(await screen.findByRole('dialog', { name: 'Log in' }))
})

it('gives every control of the transaction form dialog a name', async () => {
  stubStoredSession('admin', adminApi())
  renderRoutes('/admin?tab=transactions')
  fireEvent.click(await screen.findByRole('button', { name: 'New transaction' }))
  expectNamedControls(await screen.findByRole('dialog', { name: 'New transaction' }))
})

it('makes the tab panel focusable with a visible focus indicator', async () => {
  stubStoredSession('admin', adminApi())
  renderRoutes('/admin')
  await screen.findByRole('button', { name: 'Details for run 1a2b3c4d' })
  const panel = screen.getByRole('tabpanel')
  expect(panel).toHaveAttribute('tabindex', '0')
  expect(panel.className).toContain('focus-visible:ring')
})
