import { act, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { expect, it } from 'vitest'
import { renderWithRouter } from '../../test/render'
import { useFilters, type FiltersApi } from './useFilters'

let api: FiltersApi

function Probe() {
  const value = useFilters()
  useEffect(() => {
    api = value
  })
  return null
}

function renderAt(path: string, previous: string[] = []) {
  return renderWithRouter(<Probe />, { path, previous })
}

it('reads a shared link with parents filled in', () => {
  renderAt('/?powiat_code=0264&rooms=2&rooms=3')
  expect(api.filters).toEqual({ voivodeship_code: '02', powiat_code: '0264', rooms: [2, 3] })
})

it('drops paging params and keeps sort and order after the filters', async () => {
  const { router } = renderAt(
    '/?sort=price_premises&order=asc&after_id=10&after_value=5&city_name=%C5%81%C3%B3d%C5%BA',
  )
  act(() => api.updateFilters({ rooms: [2] }, { history: 'push' }))
  await waitFor(() =>
    expect(router.state.location.search).toBe(
      '?city_name=%C5%81%C3%B3d%C5%BA&rooms=2&sort=price_premises&order=asc',
    ),
  )
})

it('removes a key patched to undefined', async () => {
  const { router } = renderAt('/?rooms=2&city_name=Gda%C5%84sk')
  act(() => api.updateFilters({ city_name: undefined }, { history: 'push' }))
  await waitFor(() => expect(router.state.location.search).toBe('?rooms=2'))
})

it('resets the filters and keeps sort', async () => {
  const { router } = renderAt('/?powiat_code=0264&rooms=2&sort=rooms')
  act(() => api.resetFilters())
  await waitFor(() => expect(router.state.location.search).toBe('?sort=rooms'))
  expect(router.state.historyAction).toBe('PUSH')
})

it('replaces the history entry while typing', async () => {
  const { router } = renderAt('/', ['/analytics'])
  act(() => api.updateFilters({ address: 'Marsz' }, { history: 'replace' }))
  await waitFor(() => expect(router.state.location.search).toBe('?address=Marsz'))
  expect(router.state.historyAction).toBe('REPLACE')
  await act(() => router.navigate(-1))
  expect(router.state.location.pathname).toBe('/analytics')
})

it('pushes a history entry for a choice, so Back restores the filters', async () => {
  const { router } = renderAt('/?rooms=2', ['/analytics'])
  act(() => api.updateFilters({ function: 'garaz' }, { history: 'push' }))
  await waitFor(() => expect(router.state.location.search).toBe('?rooms=2&function=garaz'))
  await act(() => router.navigate(-1))
  expect(router.state.location.pathname).toBe('/')
  expect(router.state.location.search).toBe('?rooms=2')
  expect(api.filters).toEqual({ rooms: [2] })
})

it('does not navigate when the filters stay equal', () => {
  const { router } = renderAt('/?rooms=2&after_id=4')
  const before = router.state.location
  act(() => api.updateFilters({ rooms: [2] }, { history: 'push' }))
  expect(router.state.location).toBe(before)
})

it('keeps the filters object when only sort changes', async () => {
  const { router } = renderAt('/?city_name=Wroc%C5%82aw&sort=price_premises')
  const before = api.filters
  await act(() => router.navigate('/?city_name=Wroc%C5%82aw&sort=area_usable'))
  expect(router.state.location.search).toContain('sort=area_usable')
  expect(api.filters).toBe(before)
})
