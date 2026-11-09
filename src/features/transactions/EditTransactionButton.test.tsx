import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, expect, it } from 'vitest'
import { resetTokensForTests } from '../../auth/tokens'
import { stubStoredSession } from '../../test/auth'
import { callsTo, jsonResponse, type FetchHandler } from '../../test/http'
import { renderRoutes } from '../../test/render'
import { FORM_TERRITORIES, territoryTrigger } from '../../test/transactionForm'
import { transactionRow } from '../../test/transactions'

const PATCH = '/api/admin/transactions/42'
const DETAIL = '/api/transactions/42'

type Transaction = ReturnType<typeof transactionRow>

/**
 * An admin session on a server that holds transaction 42 (`stored`). A PATCH answers with `patch`;
 * by default it applies the body to the stored transaction and answers 200 with it.
 */
function stubServer(stored: Transaction, patch?: FetchHandler) {
  let current = stored
  const save: FetchHandler = async (request) => {
    const body = (await request.clone().json()) as Partial<Transaction>
    current = { ...current, ...body }
    return jsonResponse(200, current)
  }
  return stubStoredSession('admin', (request) => {
    const path = new URL(request.url).pathname
    if (path === '/api/territories') return jsonResponse(200, FORM_TERRITORIES)
    if (path === DETAIL) return jsonResponse(200, current)
    if (path === PATCH) return (patch ?? save)(request)
    return jsonResponse(200, [])
  })
}

const STORED = transactionRow({
  id: 42,
  powiat_code: '0264',
  gmina_code: null,
  price_premises: 450000,
  rooms: 3,
  district_name: 'Śródmieście',
  exclusion_reason: null,
})

beforeEach(() => {
  resetTokensForTests()
  sessionStorage.clear()
  localStorage.clear()
})

/** Opens transaction 42 as an admin and opens the edit form. */
async function openEditForm(patch?: FetchHandler, stored = STORED) {
  const mock = stubServer(stored, patch)
  renderRoutes('/transactions/42')
  const edit = await screen.findByRole('button', { name: 'Edit' })
  act(() => edit.focus())
  fireEvent.click(edit)
  const dialog = await screen.findByRole('dialog', { name: 'Edit transaction 42' })
  await waitFor(() => expect(territoryTrigger('Powiat')).toHaveAccessibleName('Powiat wrocławski'))
  return { mock, dialog, edit }
}

const field = (dialog: HTMLElement, label: string) => within(dialog).getByLabelText(label)
const type = (dialog: HTMLElement, label: string, value: string) =>
  fireEvent.change(field(dialog, label), { target: { value } })
const saveButton = (dialog: HTMLElement) => within(dialog).getByRole('button', { name: 'Save' })
const registryFlag = (dialog: HTMLElement) =>
  within(dialog).getByRole('checkbox', { name: 'Accept registry value' })

async function save(dialog: HTMLElement) {
  await waitFor(() => expect(saveButton(dialog)).toBeEnabled())
  await act(async () => {
    fireEvent.click(saveButton(dialog))
  })
}

async function sentBody(mock: ReturnType<typeof stubServer>) {
  await waitFor(() => expect(callsTo(mock, PATCH)).toHaveLength(1))
  const [request] = callsTo(mock, PATCH)
  expect(request.method).toBe('PATCH')
  return request.json()
}

it('opens the form prefilled from the transaction', async () => {
  const { dialog } = await openEditForm()
  expect(field(dialog, 'Price (PLN)')).toHaveValue('450000')
  expect(field(dialog, 'Rooms')).toHaveValue('3')
  expect(field(dialog, 'District')).toHaveValue('Śródmieście')
  expect(field(dialog, 'Date')).toHaveValue('2024-05-17')
  expect(within(dialog).getByRole('combobox', { name: 'Market' })).toHaveTextContent('Secondary')
  expect(within(dialog).getByRole('combobox', { name: 'Status' })).toHaveTextContent('Clean')
  expect(registryFlag(dialog)).not.toBeChecked()
  expect(registryFlag(dialog)).toHaveAccessibleDescription(
    /hands the record back to the registry data.*later syncs may overwrite/i,
  )
})

it('disables Save while nothing changed', async () => {
  const { dialog } = await openEditForm()
  expect(saveButton(dialog)).toBeDisabled()
})

it('sends only the changed field', async () => {
  const { mock, dialog } = await openEditForm()
  type(dialog, 'Price (PLN)', '460000')
  await save(dialog)
  expect(await sentBody(mock)).toEqual({ price_premises: 460000 })
})

it('sends an emptied field as null', async () => {
  const { mock, dialog } = await openEditForm()
  type(dialog, 'District', '')
  await save(dialog)
  expect(await sentBody(mock)).toEqual({ district_name: null })
})

it('sends only the registry flag when it is checked without a change', async () => {
  const { mock, dialog } = await openEditForm()
  fireEvent.click(registryFlag(dialog))
  await save(dialog)
  expect(await sentBody(mock)).toEqual({ accept_registry: true })
})

it('sends the registry flag with a change', async () => {
  const { mock, dialog } = await openEditForm()
  type(dialog, 'Price (PLN)', '460000')
  fireEvent.click(registryFlag(dialog))
  await save(dialog)
  expect(await sentBody(mock)).toEqual({ price_premises: 460000, accept_registry: true })
})

it('closes, says it saved and shows the new price after the refetch', async () => {
  const { mock, dialog, edit } = await openEditForm()
  expect(screen.getByText('450,000 PLN')).toBeInTheDocument()
  type(dialog, 'Price (PLN)', '460000')
  await save(dialog)

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(await screen.findByText('Transaction 42 saved')).toBeInTheDocument()
  expect(await screen.findByText('460,000 PLN')).toBeInTheDocument()
  expect(callsTo(mock, DETAIL)).toHaveLength(2)
  await waitFor(() => expect(edit).toHaveFocus())
})

it('says the transaction no longer exists on a 404 and stays open', async () => {
  const { dialog } = await openEditForm(() =>
    jsonResponse(404, { detail: 'Transaction not found' }),
  )
  type(dialog, 'Rooms', '4')
  await save(dialog)
  expect(await within(dialog).findByRole('alert')).toHaveTextContent(
    'This transaction no longer exists',
  )
  expect(screen.getByRole('dialog', { name: 'Edit transaction 42' })).toBeInTheDocument()
  expect(field(dialog, 'Rooms')).toHaveValue('4')
})

it('keeps a stored market spelling when another field changes', async () => {
  const { mock, dialog } = await openEditForm(undefined, { ...STORED, market_type: 'rynekWtorny' })
  expect(within(dialog).getByRole('combobox', { name: 'Market' })).toHaveTextContent(
    'Secondary (rynekWtorny)',
  )
  type(dialog, 'Rooms', '4')
  await save(dialog)
  expect(await sentBody(mock)).toEqual({ rooms: 4 })
})
