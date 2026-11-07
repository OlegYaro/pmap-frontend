import { act, fireEvent, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderWithDraft } from '../../../test/render'
import { RangeField, type RangeKind } from './RangeField'

function renderRange(kind: RangeKind, path = '/') {
  return renderWithDraft(<RangeField kind={kind} />, { path })
}

async function search() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
  })
}

it('accepts a comma as decimal separator for area', async () => {
  const { router } = renderRange('area')
  const input = screen.getByRole('textbox', { name: 'Min area' })
  fireEvent.change(input, { target: { value: '42,5' } })
  expect(router.state.location.search).toBe('')
  await search()
  expect(router.state.location.search).toBe('?area_min=42.5')
  expect(input).toHaveValue('42,5')
})

it('accepts a floor below ground', async () => {
  const { router } = renderRange('floor')
  fireEvent.change(screen.getByRole('textbox', { name: 'Min floor' }), { target: { value: '-1' } })
  await search()
  expect(router.state.location.search).toBe('?floor_min=-1')
})

it('marks a decimal floor invalid once the input is left and does not search it', async () => {
  const { router } = renderRange('floor')
  const input = screen.getByRole('textbox', { name: 'Max floor' })
  fireEvent.change(input, { target: { value: '2.5' } })
  expect(input).not.toHaveAttribute('aria-invalid')
  fireEvent.blur(input)
  expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(input).toHaveAccessibleDescription('Enter a whole number')
  await search()
  expect(router.state.location.search).toBe('')
})

it('marks text in a price invalid on Enter and clears the mark when fixed', async () => {
  const { router } = renderRange('price')
  const input = screen.getByRole('textbox', { name: 'Min price' })
  fireEvent.change(input, { target: { value: 'abc' } })
  fireEvent.keyDown(input, { key: 'Enter' })
  expect(screen.getByText('Enter a number')).toBeInTheDocument()
  fireEvent.change(input, { target: { value: '300000' } })
  expect(input).not.toHaveAttribute('aria-invalid')
  expect(screen.queryByText('Enter a number')).not.toBeInTheDocument()
  await search()
  expect(router.state.location.search).toBe('?price_min=300000')
})

it('does not search an older value while the input shows an error', async () => {
  const { router } = renderRange('price', '/?price_min=1000')
  const input = screen.getByRole('textbox', { name: 'Min price' })
  fireEvent.change(input, { target: { value: '1000x' } })
  fireEvent.blur(input)
  await search()
  expect(router.state.location.search).toBe('')
  expect(screen.getByText('Enter a number')).toBeInTheDocument()
})

it('shows the values from the URL and points out a swapped range', () => {
  renderRange('price', '/?price_min=500000&price_max=100000')
  expect(screen.getByRole('textbox', { name: 'Min price' })).toHaveValue('500000')
  expect(screen.getByRole('textbox', { name: 'Max price' })).toHaveValue('100000')
  expect(screen.getByText('Min is greater than max')).toBeInTheDocument()
})

it('groups the inputs under the field name', () => {
  renderRange('area')
  expect(screen.getByRole('group', { name: 'Area (m²)' })).toBeInTheDocument()
})

it('writes a date on search and pushes the history entry', async () => {
  const { router } = renderRange('dates')
  fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2024-01-01' } })
  await search()
  expect(router.state.location.search).toBe('?date_from=2024-01-01')
  expect(router.state.historyAction).toBe('PUSH')
})
