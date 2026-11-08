import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, expect, it } from 'vitest'
import { resetTokensForTests } from '../../../auth/tokens'
import { adminApi } from '../../../test/admin'
import { stubStoredSession } from '../../../test/auth'
import { callsTo, jsonResponse, type FetchHandler } from '../../../test/http'
import { renderRoutes } from '../../../test/render'
import { pickOption } from '../../../test/select'
import {
  chooseTerritory,
  FORM_TERRITORIES,
  waitForTerritories,
} from '../../../test/transactionForm'
import { transactionRow } from '../../../test/transactions'

const CREATE = '/api/admin/transactions'

/** The admin API plus `POST /admin/transactions` answered by `create` (201 with id 777). */
function createApi(
  create: FetchHandler = () => jsonResponse(201, transactionRow({ id: 777 })),
): FetchHandler {
  const admin = adminApi()
  return (request) => {
    const path = new URL(request.url).pathname
    if (path === CREATE) return create(request)
    if (path === '/api/territories') return jsonResponse(200, FORM_TERRITORIES)
    return admin(request)
  }
}

beforeEach(() => {
  resetTokensForTests()
  sessionStorage.clear()
  localStorage.clear()
})

/** Signs in as an admin, shows the Transactions tab and opens the empty form. */
async function openCreateForm() {
  const mock = stubStoredSession('admin', createApi())
  const view = renderRoutes('/admin?tab=transactions')
  fireEvent.click(await screen.findByRole('button', { name: 'New transaction' }))
  const dialog = await screen.findByRole('dialog', { name: 'New transaction' })
  await waitForTerritories()
  return { ...view, mock, dialog }
}

async function create(dialog: HTMLElement) {
  await act(async () => {
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }))
  })
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
}

const sentBody = (mock: ReturnType<typeof stubStoredSession>) => callsTo(mock, CREATE)[0].json()

it('sends only the powiat for a minimal transaction', async () => {
  const { mock, dialog } = await openCreateForm()
  await chooseTerritory('Powiat', '0264', 'wrocławski')
  await create(dialog)
  expect(callsTo(mock, CREATE)).toHaveLength(1)
  expect(callsTo(mock, CREATE)[0].method).toBe('POST')
  expect(await sentBody(mock)).toEqual({ powiat_code: '0264' })
})

it('sends a full transaction with numbers as numbers', async () => {
  const { mock, dialog } = await openCreateForm()
  await chooseTerritory('Powiat', '0264', 'wrocławski')
  await chooseTerritory('Gmina', 'kąty', 'Kąty Wrocławskie')
  const type = (label: string, value: string) =>
    fireEvent.change(within(dialog).getByLabelText(label), { target: { value } })
  type('City', 'Bielsko')
  type('Price (PLN)', '450000')
  type('Area (m²)', '52.5')
  type('Rooms', '3')
  type('Floor', '2')
  type('Date', '2026-03-15')
  await create(dialog)
  expect(await sentBody(mock)).toEqual({
    powiat_code: '0264',
    gmina_code: '0264011',
    city_name: 'Bielsko',
    price_premises: 450000,
    area_usable: 52.5,
    rooms: 3,
    floor: 2,
    transaction_date: '2026-03-15',
  })
})

it('sends the exclusion reason of an excluded status', async () => {
  const { mock, dialog } = await openCreateForm()
  await chooseTerritory('Powiat', '0264', 'wrocławski')
  await act(() =>
    pickOption(within(dialog).getByRole('combobox', { name: 'Status' }), 'Non-market'),
  )
  await create(dialog)
  expect(await sentBody(mock)).toEqual({ powiat_code: '0264', exclusion_reason: 'non_market' })
})

it('closes, stays on the tab and shows a toast that links to the new transaction', async () => {
  const { dialog, router } = await openCreateForm()
  await chooseTerritory('Powiat', '0264', 'wrocławski')
  await create(dialog)

  expect(await screen.findByText('Transaction 777 created')).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/admin')
  expect(router.state.location.search).toBe('?tab=transactions')
  const link = screen.getByRole('link', { name: 'View transaction' })
  expect(link).toHaveAttribute('href', '/transactions/777')

  await act(async () => {
    fireEvent.click(link)
  })
  expect(router.state.location.pathname).toBe('/transactions/777')
})

it('requests a list loaded earlier again after a creation', async () => {
  const mock = stubStoredSession('admin', createApi())
  const { router } = renderRoutes('/')
  await waitFor(() => expect(callsTo(mock, '/api/transactions')).toHaveLength(1))

  await act(() => router.navigate('/admin?tab=transactions'))
  fireEvent.click(await screen.findByRole('button', { name: 'New transaction' }))
  const dialog = await screen.findByRole('dialog', { name: 'New transaction' })
  await waitForTerritories()
  await chooseTerritory('Powiat', '0264', 'wrocławski')
  await create(dialog)
  expect(callsTo(mock, '/api/transactions')).toHaveLength(1)

  await act(() => router.navigate('/'))
  await waitFor(() => expect(callsTo(mock, '/api/transactions')).toHaveLength(2))
})
