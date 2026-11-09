import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { deferred, jsonResponse, stubFetch } from '../../../test/http'
import { renderWithDraft } from '../../../test/render'
import { TERRITORIES } from '../../../test/territories'
import { TerritoryField } from './TerritoryField'

const trigger = (level: string) => screen.getByRole('button', { name: new RegExp(`^${level}`) })

async function choose(level: string, option: string) {
  fireEvent.click(trigger(level))
  await act(async () => {
    fireEvent.click(screen.getByRole('option', { name: option }))
  })
}

async function search() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
  })
}

async function renderLoaded(path = '/') {
  stubFetch(() => jsonResponse(200, TERRITORIES))
  const view = renderWithDraft(<TerritoryField />, { path })
  await waitFor(() => expect(trigger('Voivodeship')).toBeEnabled())
  return view
}

it('clears powiat and gmina when another voivodeship is chosen, in one entry', async () => {
  const { router } = await renderLoaded('/?voivodeship_code=14&powiat_code=1465&gmina_code=1465011')
  expect(trigger('Gmina')).toHaveAccessibleName('Gmina Warszawa')
  await choose('Voivodeship', 'małopolskie')
  expect(trigger('Gmina')).toBeDisabled()
  expect(router.state.location.search).toBe(
    '?voivodeship_code=14&powiat_code=1465&gmina_code=1465011',
  )
  await search()
  expect(router.state.location.search).toBe('?voivodeship_code=12')
  expect(router.state.historyAction).toBe('PUSH')
})

it('fills the voivodeship when a powiat is chosen first', async () => {
  const { router } = await renderLoaded()
  await choose('Powiat', 'Kraków')
  expect(trigger('Voivodeship')).toHaveAccessibleName('Voivodeship małopolskie')
  await search()
  expect(router.state.location.search).toBe('?voivodeship_code=12&powiat_code=1261')
})

it('narrows powiats to the chosen voivodeship', async () => {
  await renderLoaded('/?voivodeship_code=14')
  fireEvent.click(trigger('Powiat'))
  const names = screen.getAllByRole('option').map((option) => option.textContent)
  expect(names).toEqual(['Any', 'otwocki', 'Warszawa'])
})

it('removes powiat and gmina with "Any"', async () => {
  const { router } = await renderLoaded('/?powiat_code=1465&gmina_code=1465011')
  await choose('Powiat', 'Any')
  await search()
  expect(router.state.location.search).toBe('?voivodeship_code=14')
})

it('finds a powiat without diacritics', async () => {
  await renderLoaded()
  fireEvent.click(trigger('Powiat'))
  fireEvent.change(screen.getByRole('combobox', { name: 'Search powiats' }), {
    target: { value: 'lodz' },
  })
  expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Łódź'])
})

it('disables the gmina until a powiat is chosen', async () => {
  await renderLoaded('/?voivodeship_code=14')
  expect(trigger('Gmina')).toBeDisabled()
})

it('shows "Loading…" and the URL codes while the list loads', () => {
  const held = deferred<Response>()
  stubFetch(() => held.promise)
  renderWithDraft(<TerritoryField />, { path: '/?powiat_code=1465' })
  expect(trigger('Voivodeship')).toHaveAccessibleName('Voivodeship 14')
  expect(trigger('Powiat')).toHaveAccessibleName('Powiat 1465')
  expect(trigger('Gmina')).toHaveAccessibleName('Gmina Loading…')
  expect(trigger('Powiat')).toBeDisabled()
})

it('offers a retry when the list fails, then lists voivodeships', async () => {
  let fail = true
  stubFetch(() => (fail ? jsonResponse(503, { detail: 'down' }) : jsonResponse(200, TERRITORIES)))
  renderWithDraft(<TerritoryField />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load territories')
  expect(trigger('Voivodeship')).toBeDisabled()
  fail = false
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  await waitFor(() => expect(trigger('Voivodeship')).toBeEnabled())
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  fireEvent.click(trigger('Voivodeship'))
  expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
    'Any',
    'łódzkie',
    'małopolskie',
    'mazowieckie',
  ])
})
