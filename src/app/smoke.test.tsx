import { screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it } from 'vitest'
import { resetTokensForTests } from '../auth/tokens'
import { adminApi } from '../test/admin'
import { emptyApi } from '../test/analytics'
import { stubStoredSession } from '../test/auth'
import { jsonResponse, stubFetch } from '../test/http'
import { renderRoutes } from '../test/render'
import { stubApi, transactionRow } from '../test/transactions'

beforeEach(() => {
  resetTokensForTests()
  sessionStorage.clear()
  localStorage.clear()
})

/** Waits for the page to settle on `title`, then checks the heading and the landmark. */
async function expectPage(title: string, heading: string) {
  await waitFor(() => expect(document.title).toBe(title))
  expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  expect(screen.getByRole('main')).toBeInTheDocument()
}

it('renders /', async () => {
  stubFetch(emptyApi)
  renderRoutes('/')
  await expectPage('Transactions · PMAP', 'Transactions')
})

it('renders /analytics', async () => {
  stubFetch(emptyApi)
  renderRoutes('/analytics')
  await expectPage('Analytics · PMAP', 'Analytics')
})

it('renders /transactions/42', async () => {
  stubApi({ transaction: () => jsonResponse(200, transactionRow({ id: 42 })) })
  renderRoutes('/transactions/42')
  await expectPage('Transaction 42 · PMAP', 'Transaction 42')
})

it('renders /admin for an admin', async () => {
  stubStoredSession('admin', adminApi())
  renderRoutes('/admin')
  await expectPage('Admin · PMAP', 'Admin')
})

it('renders /admin as access denied for a non-admin', async () => {
  stubStoredSession('user', emptyApi)
  renderRoutes('/admin')
  await expectPage('Access denied · PMAP', 'Access denied')
})

it('renders an unknown path as not found', async () => {
  stubFetch(emptyApi)
  renderRoutes('/does-not-exist')
  await expectPage('Page not found · PMAP', 'Page not found')
})
