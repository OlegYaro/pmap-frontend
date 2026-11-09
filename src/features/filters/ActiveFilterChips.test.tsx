import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, expect, it } from 'vitest'
import { jsonResponse, stubFetch } from '../../test/http'
import { renderWithRouter } from '../../test/render'
import { TERRITORIES } from '../../test/territories'
import { ActiveFilterChips } from './ActiveFilterChips'
import { FILTER_FIELDS } from './model'

beforeEach(() => {
  stubFetch(() => jsonResponse(200, TERRITORIES))
})

const list = () => screen.getByRole('region', { name: 'Active filters' })
const chipLabels = () =>
  within(list())
    .queryAllByRole('listitem')
    .map((item) => item.textContent)

it('shows territory names once the list has loaded', async () => {
  renderWithRouter(<ActiveFilterChips />, { path: '/?powiat_code=1465' })
  await waitFor(() =>
    expect(chipLabels()).toEqual(['Voivodeship: mazowieckie', 'Powiat: Warszawa']),
  )
})

it('removes a range chip as a pushed entry', async () => {
  const { router } = renderWithRouter(<ActiveFilterChips />, {
    path: '/?price_min=200000&price_max=500000&rooms=2',
  })
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Remove Price: 200,000 – 500,000 PLN' }))
  })
  expect(router.state.location.search).toBe('?rooms=2')
  expect(router.state.historyAction).toBe('PUSH')
  expect(chipLabels()).toEqual(['Rooms: 2'])
})

it('resets every filter and keeps sort', async () => {
  const { router } = renderWithRouter(<ActiveFilterChips />, {
    path: '/?city_name=Gda%C5%84sk&rooms=3&sort=price_premises',
  })
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Reset all' }))
  })
  expect(router.state.location.search).toBe('?sort=price_premises')
  expect(chipLabels()).toEqual([])
  expect(list()).toHaveFocus()
  expect(list()).toHaveTextContent('No active filters')
})

it('offers no reset without filters', () => {
  renderWithRouter(<ActiveFilterChips />)
  expect(screen.queryByRole('button', { name: 'Reset all' })).not.toBeInTheDocument()
  expect(list()).toHaveTextContent('No active filters')
})

it('moves focus to the next chip after a keyboard removal', async () => {
  renderWithRouter(<ActiveFilterChips />, { path: '/?rooms=1&rooms=2&rooms=3' })
  const middle = screen.getByRole('button', { name: 'Remove Rooms: 2' })
  middle.focus()
  await act(async () => {
    fireEvent.click(middle)
  })
  expect(chipLabels()).toEqual(['Rooms: 1', 'Rooms: 3'])
  expect(screen.getByRole('button', { name: 'Remove Rooms: 3' })).toHaveFocus()
})

it('moves focus to the previous chip when the last one is removed', async () => {
  renderWithRouter(<ActiveFilterChips />, { path: '/?rooms=1&rooms=2' })
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Remove Rooms: 2' }))
  })
  expect(screen.getByRole('button', { name: 'Remove Rooms: 1' })).toHaveFocus()
})

it('moves focus to the list when no chip remains', async () => {
  renderWithRouter(<ActiveFilterChips />, { path: '/?rooms=1' })
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Remove Rooms: 1' }))
  })
  expect(list()).toHaveFocus()
})

it('hides chips of fields that are not shown', () => {
  renderWithRouter(
    <ActiveFilterChips fields={FILTER_FIELDS.filter((field) => field !== 'rows')} />,
    { path: '/?exclusion_reason=clean&rooms=2' },
  )
  expect(chipLabels()).toEqual(['Rooms: 2'])
})
