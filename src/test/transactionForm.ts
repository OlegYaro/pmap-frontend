import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { expect } from 'vitest'
import { ADMIN_TERRITORIES } from './admin'
import { territoryRow } from './territories'

/** The admin territory list plus a gmina of the powiat `0264`. */
export const FORM_TERRITORIES = [
  ...ADMIN_TERRITORIES,
  territoryRow(['02', 'dolnośląskie'], ['0264', 'wrocławski'], ['0264011', 'Kąty Wrocławskie']),
]

export type TerritoryLabel = 'Powiat' | 'Gmina'

/** The trigger of the form's powiat or gmina select (named by the label and the value). */
export const territoryTrigger = (label: TerritoryLabel) =>
  screen.getByRole('button', { name: new RegExp(`^${label} `) })

const searchName = (label: TerritoryLabel) => `Search ${label.toLowerCase()}s`

/** Waits until the powiat list shows `name`, then closes the list again. */
export async function waitForTerritories(name = 'wrocławski') {
  fireEvent.click(territoryTrigger('Powiat'))
  await screen.findByRole('option', { name })
  fireEvent.keyDown(screen.getByRole('combobox', { name: searchName('Powiat') }), {
    key: 'Escape',
  })
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
}

/** Opens the powiat or gmina list, searches for `search` and clicks the option `name`. */
export async function chooseTerritory(label: TerritoryLabel, search: string, name: string) {
  fireEvent.click(territoryTrigger(label))
  const input = await screen.findByRole('combobox', { name: searchName(label) })
  fireEvent.change(input, { target: { value: search } })
  await act(async () => {
    fireEvent.click(await screen.findByRole('option', { name }))
  })
  // Radix returns focus to the trigger after a tick; another list opened before that would close.
  await waitFor(() => expect(territoryTrigger(label)).toHaveFocus())
}

/** The option names a searchable select lists for `search`; leaves the list closed. */
export function territoryOptions(label: TerritoryLabel, search = '') {
  fireEvent.click(territoryTrigger(label))
  const input = screen.getByRole('combobox', { name: searchName(label) })
  fireEvent.change(input, { target: { value: search } })
  const names = screen.queryAllByRole('option').map((option) => option.textContent)
  fireEvent.keyDown(input, { key: 'Escape' })
  return names
}
