import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, expect, it } from 'vitest'
import { stubAdminApi } from '../../test/admin'
import { renderWithRouter } from '../../test/render'
import { TransactionsTab } from './TransactionsTab'

beforeEach(() => {
  stubAdminApi()
})

it('describes the tab and offers "New transaction"', () => {
  renderWithRouter(<TransactionsTab />, { path: '/admin?tab=transactions' })
  expect(screen.getByText(/Add a transaction that is missing/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'New transaction' })).toBeEnabled()
  expect(screen.queryByText(/not available/)).not.toBeInTheDocument()
})

it('opens the empty form titled "New transaction" with the status Clean', async () => {
  renderWithRouter(<TransactionsTab />, { path: '/admin?tab=transactions' })
  fireEvent.click(screen.getByRole('button', { name: 'New transaction' }))
  const dialog = await screen.findByRole('dialog', { name: 'New transaction' })
  const form = within(dialog)
  expect(form.getByRole('button', { name: /^Powiat / })).toHaveAccessibleName('Powiat —')
  for (const label of ['City', 'District', 'Address', 'Date', 'Price (PLN)', 'Building id']) {
    expect(form.getByLabelText(label)).toHaveValue('')
  }
  expect(form.getByRole('combobox', { name: 'Market' })).toHaveTextContent('—')
  expect(form.getByRole('combobox', { name: 'Status' })).toHaveTextContent('Clean')
  expect(form.getByRole('button', { name: 'Create' })).toBeEnabled()
})
