import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { useState } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import { Button } from '@/components/ui/button'
import { ApiError } from '../../../api/errors'
import { deferred, jsonResponse, stubFetch } from '../../../test/http'
import { renderWithRouter } from '../../../test/render'
import { pickOption } from '../../../test/select'
import {
  chooseTerritory,
  FORM_TERRITORIES,
  territoryOptions,
  territoryTrigger,
  waitForTerritories,
} from '../../../test/transactionForm'
import { EMPTY_FORM, type FormValues } from './formSchema'
import { TransactionFormDialog, type TransactionFormMode } from './TransactionFormDialog'

type Submit = (values: FormValues, acceptRegistry: boolean) => Promise<void>

function Harness({
  mode,
  initial,
  onSubmit,
}: {
  mode: TransactionFormMode
  initial: FormValues
  onSubmit: Submit
}) {
  const [open, setOpen] = useState(false)
  return (
    <TransactionFormDialog
      mode={mode}
      title="New transaction"
      initial={initial}
      open={open}
      onOpenChange={setOpen}
      trigger={<Button>Open form</Button>}
      onSubmit={async (values, acceptRegistry) => {
        await onSubmit(values, acceptRegistry)
        setOpen(false)
      }}
    />
  )
}

beforeEach(() => {
  stubFetch((request) =>
    new URL(request.url).pathname === '/api/territories'
      ? jsonResponse(200, FORM_TERRITORIES)
      : jsonResponse(200, []),
  )
})

/** Renders the closed dialog, opens it and waits for the territory list. */
async function openForm({
  mode = 'create',
  initial = EMPTY_FORM,
  onSubmit = vi.fn<Submit>(() => Promise.resolve()),
}: { mode?: TransactionFormMode; initial?: FormValues; onSubmit?: Submit } = {}) {
  renderWithRouter(<Harness mode={mode} initial={initial} onSubmit={onSubmit} />)
  const opener = screen.getByRole('button', { name: 'Open form' })
  act(() => opener.focus())
  fireEvent.click(opener)
  const dialog = await screen.findByRole('dialog', { name: 'New transaction' })
  await waitForTerritories()
  return { dialog, opener, onSubmit }
}

const field = (label: string) => screen.getByLabelText(label)
const select = (label: string) => screen.getByRole('combobox', { name: label })

async function submit(dialog: HTMLElement, name = 'Create') {
  await act(async () => {
    fireEvent.click(within(dialog).getByRole('button', { name }))
  })
}

it('has the labelled fields in order and one column below sm', async () => {
  const { dialog } = await openForm()
  const labels = [...dialog.querySelectorAll('label')].map((label) => label.textContent)
  expect(labels).toEqual([
    'Powiat*',
    'Gmina',
    'City',
    'District',
    'Address',
    'Date',
    'Price (PLN)',
    'Area (m²)',
    'Rooms',
    'Floor',
    'Market',
    'Function',
    'Building id',
    'Status',
  ])
  expect(territoryTrigger('Powiat')).toHaveAccessibleName('Powiat —')
  expect(select('Status')).toHaveTextContent('Clean')
  expect(field('City').closest('.grid.gap-4')).toHaveClass('sm:grid-cols-2')
  expect(dialog).toHaveClass('overflow-y-auto')
  expect(within(dialog).queryByRole('checkbox')).not.toBeInTheDocument()
})

it('lists only the gminas of the chosen powiat', async () => {
  await openForm()
  expect(territoryTrigger('Gmina')).toBeDisabled()
  await chooseTerritory('Powiat', 'otw', 'otwocki')
  expect(territoryTrigger('Gmina')).toBeEnabled()
  expect(territoryOptions('Gmina')).toEqual(['—', 'Józefów'])
})

it('clears the gmina when another powiat is chosen', async () => {
  await openForm()
  await chooseTerritory('Powiat', 'otw', 'otwocki')
  await chooseTerritory('Gmina', 'józ', 'Józefów')
  expect(territoryTrigger('Gmina')).toHaveAccessibleName('Gmina Józefów')
  await chooseTerritory('Powiat', 'warsz', 'Warszawa')
  expect(territoryTrigger('Gmina')).toHaveAccessibleName('Gmina —')
})

it('shows prefilled codes missing from the territory list as they are', async () => {
  await openForm({ initial: { ...EMPTY_FORM, powiat: '9999', gmina: '9999011' } })
  expect(territoryTrigger('Powiat')).toHaveAccessibleName('Powiat 9999')
  expect(territoryTrigger('Gmina')).toHaveAccessibleName('Gmina 9999011')
})

it('keeps a stored market spelling as a readable choice', async () => {
  await openForm({ initial: { ...EMPTY_FORM, powiat: '0264', market: 'rynekWtorny' } })
  expect(select('Market')).toHaveTextContent('Secondary (rynekWtorny)')
  fireEvent.keyDown(select('Market'), { key: 'Enter' })
  const names = (await screen.findAllByRole('option')).map((option) => option.textContent)
  expect(names).toEqual(['—', 'Primary', 'Secondary', 'Secondary (rynekWtorny)'])
})

it('lists Clean first, then the readable exclusion reasons', async () => {
  await openForm()
  fireEvent.keyDown(select('Status'), { key: 'Enter' })
  const names = (await screen.findAllByRole('option')).map((option) => option.textContent)
  expect(names).toEqual([
    'Clean',
    'Fractional share',
    'Package deal',
    'Non-market',
    'Missing fields',
    'Implausible area',
    'Unassigned',
    'No city / district',
    'Implausible price',
  ])
})

it('passes the chosen selects and the trimmed text to onSubmit', async () => {
  const { dialog, onSubmit } = await openForm()
  await chooseTerritory('Powiat', '0264', 'wrocławski')
  fireEvent.change(field('City'), { target: { value: '  Bielsko ' } })
  await act(() => pickOption(select('Market'), 'Primary'))
  await act(() => pickOption(select('Status'), 'Non-market'))
  await submit(dialog)
  expect(onSubmit).toHaveBeenCalledWith(
    { ...EMPTY_FORM, powiat: '0264', city: 'Bielsko', market: 'pierwotny', status: 'non_market' },
    false,
  )
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})

it('requires a powiat, focuses it and sends nothing', async () => {
  const { dialog, onSubmit } = await openForm()
  await submit(dialog)
  expect(await within(dialog).findByText('Choose a powiat')).toBeInTheDocument()
  expect(territoryTrigger('Powiat')).toHaveAttribute('aria-invalid', 'true')
  expect(territoryTrigger('Powiat')).toHaveAccessibleDescription('Choose a powiat')
  await waitFor(() => expect(territoryTrigger('Powiat')).toHaveFocus())
  expect(onSubmit).not.toHaveBeenCalled()
})

it('rejects a price of 0 and fractional rooms', async () => {
  const { dialog, onSubmit } = await openForm({ initial: { ...EMPTY_FORM, powiat: '0264' } })
  fireEvent.change(field('Price (PLN)'), { target: { value: '0' } })
  fireEvent.change(field('Rooms'), { target: { value: '2.5' } })
  await submit(dialog)
  expect(field('Price (PLN)')).toHaveAttribute('aria-invalid', 'true')
  expect(field('Price (PLN)')).toHaveAccessibleDescription('Enter a price greater than 0')
  expect(field('Rooms')).toHaveAccessibleDescription('Enter a whole number of at least 1')
  await waitFor(() => expect(field('Price (PLN)')).toHaveFocus())
  expect(onSubmit).not.toHaveBeenCalled()
})

it('shows a 422 field message on the field and focuses it', async () => {
  const detail = [{ loc: ['body', 'area_usable'], msg: 'Input should be greater than 0' }]
  const onSubmit = vi.fn<Submit>(() => Promise.reject(new ApiError(422, 'x', { detail })))
  const { dialog } = await openForm({ initial: { ...EMPTY_FORM, powiat: '0264' }, onSubmit })
  fireEvent.change(field('Area (m²)'), { target: { value: '5' } })
  await submit(dialog)
  expect(field('Area (m²)')).toHaveAccessibleDescription('Input should be greater than 0')
  expect(field('Area (m²)')).toHaveAttribute('aria-invalid', 'true')
  await waitFor(() => expect(field('Area (m²)')).toHaveFocus())
  expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument()
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})

it('shows other failures at the top, keeps the input and clears them on the next submit', async () => {
  const onSubmit = vi.fn<Submit>(() => Promise.reject(new ApiError(502, 'Bad gateway')))
  const { dialog } = await openForm({ initial: { ...EMPTY_FORM, powiat: '0264' }, onSubmit })
  fireEvent.change(field('City'), { target: { value: 'Bielsko' } })
  await submit(dialog)
  const alert = within(dialog).getByRole('alert')
  expect(alert).toHaveTextContent('Bad gateway')
  expect(dialog.querySelector('form')?.firstElementChild).toBe(alert)
  expect(field('City')).toHaveValue('Bielsko')

  onSubmit.mockImplementation(() => new Promise(() => {}))
  fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }))
  expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument()
})

it('disables submit while the request is pending', async () => {
  const held = deferred<void>()
  const onSubmit = vi.fn<Submit>(() => held.promise)
  const { dialog } = await openForm({ initial: { ...EMPTY_FORM, powiat: '0264' }, onSubmit })
  await submit(dialog)
  const pending = within(dialog).getByRole('button', { name: 'Creating…' })
  expect(pending).toBeDisabled()
  fireEvent.click(pending)
  expect(onSubmit).toHaveBeenCalledTimes(1)
  await act(async () => held.resolve())
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})

it('closes on Escape without sending, returns focus and starts empty again', async () => {
  const { dialog, opener, onSubmit } = await openForm()
  fireEvent.change(field('City'), { target: { value: 'Bielsko' } })
  fireEvent.keyDown(dialog, { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  await waitFor(() => expect(opener).toHaveFocus())
  expect(onSubmit).not.toHaveBeenCalled()

  fireEvent.click(opener)
  await screen.findByRole('dialog')
  expect(field('City')).toHaveValue('')
})

it('closes with Cancel', async () => {
  const { dialog, onSubmit } = await openForm()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(onSubmit).not.toHaveBeenCalled()
})

it('in edit mode enables Save on a change or the registry flag', async () => {
  const initial = { ...EMPTY_FORM, powiat: '0264', price: '450000' }
  const { dialog, onSubmit } = await openForm({ mode: 'edit', initial })
  const save = within(dialog).getByRole('button', { name: 'Save' })
  expect(save).toBeDisabled()

  fireEvent.change(field('Price (PLN)'), { target: { value: '460000' } })
  await waitFor(() => expect(save).toBeEnabled())
  fireEvent.change(field('Price (PLN)'), { target: { value: '450000' } })
  await waitFor(() => expect(save).toBeDisabled())

  const flag = within(dialog).getByRole('checkbox', { name: 'Accept registry value' })
  expect(flag).toHaveAccessibleDescription(/hands the record back to the registry data/i)
  fireEvent.click(flag)
  await waitFor(() => expect(save).toBeEnabled())
  await submit(dialog, 'Save')
  expect(onSubmit).toHaveBeenCalledWith(initial, true)
})
