import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { expect, it, vi } from 'vitest'
import { SearchableSelect } from './SearchableSelect'

const OPTIONS = [
  { value: '1061', label: 'Łódź' },
  { value: '1465', label: 'Warszawa' },
  { value: '1261', label: 'Kraków' },
]

function Harness({
  initial,
  onChange,
  disabled,
}: {
  initial?: string
  onChange: (value: string | undefined) => void
  disabled?: boolean
}) {
  const [value, setValue] = useState(initial)
  return (
    <>
      <span id="powiat-label">Powiat</span>
      <SearchableSelect
        labelId="powiat-label"
        options={OPTIONS}
        value={value}
        searchLabel="Search powiats"
        disabled={disabled}
        onChange={(next) => {
          setValue(next)
          onChange(next)
        }}
      />
    </>
  )
}

function setup(props: { initial?: string; disabled?: boolean } = {}) {
  const onChange = vi.fn()
  render(<Harness onChange={onChange} {...props} />)
  return { onChange, trigger: screen.getByRole('button', { name: /^Powiat/ }) }
}

function open(trigger: HTMLElement) {
  fireEvent.click(trigger)
  return screen.getByRole('combobox', { name: 'Search powiats' })
}

const optionNames = () => screen.queryAllByRole('option').map((option) => option.textContent)

it('names the trigger by the label and the value', () => {
  const { trigger } = setup({ initial: '1465' })
  expect(trigger).toHaveAccessibleName('Powiat Warszawa')
})

it('focuses the search input and lists "Any" first', async () => {
  const { trigger } = setup()
  const input = open(trigger)
  await waitFor(() => expect(input).toHaveFocus())
  expect(optionNames()).toEqual(['Any', 'Łódź', 'Warszawa', 'Kraków'])
})

it('filters ignoring case, diacritics, and by code', () => {
  const { trigger } = setup()
  const input = open(trigger)
  fireEvent.change(input, { target: { value: 'LODZ' } })
  expect(optionNames()).toEqual(['Łódź'])
  fireEvent.change(input, { target: { value: '126' } })
  expect(optionNames()).toEqual(['Kraków'])
})

it('shows "No matches"', () => {
  const { trigger } = setup()
  const input = open(trigger)
  fireEvent.change(input, { target: { value: 'zzz' } })
  expect(screen.getByText('No matches')).toBeInTheDocument()
  expect(optionNames()).toEqual([])
})

it('picks with ArrowDown and Enter, then closes', async () => {
  const { trigger, onChange } = setup()
  const input = open(trigger)
  fireEvent.keyDown(input, { key: 'ArrowDown' })
  fireEvent.keyDown(input, { key: 'ArrowDown' })
  expect(input).toHaveAttribute('aria-activedescendant', screen.getAllByRole('option')[2].id)
  fireEvent.keyDown(input, { key: 'Enter' })
  expect(onChange).toHaveBeenCalledWith('1465')
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
  expect(trigger).toHaveAccessibleName('Powiat Warszawa')
})

it('clears with "Any"', () => {
  const { trigger, onChange } = setup({ initial: '1465' })
  open(trigger)
  fireEvent.click(screen.getByRole('option', { name: 'Any' }))
  expect(onChange).toHaveBeenCalledWith(undefined)
})

it('marks the current value as selected', () => {
  const { trigger } = setup({ initial: '1261' })
  open(trigger)
  expect(screen.getByRole('option', { name: 'Kraków' })).toHaveAttribute('aria-selected', 'true')
})

it('closes on Escape and returns focus to the trigger', async () => {
  const { trigger } = setup()
  const input = open(trigger)
  await waitFor(() => expect(input).toHaveFocus())
  fireEvent.keyDown(input, { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
  expect(trigger).toHaveFocus()
})

it('cannot open when disabled', () => {
  const { trigger } = setup({ disabled: true })
  expect(trigger).toBeDisabled()
  fireEvent.click(trigger)
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})
