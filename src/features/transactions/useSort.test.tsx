import { act, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { expect, it } from 'vitest'
import { renderWithRouter } from '../../test/render'
import { useFilters, type FiltersApi } from '../filters/useFilters'
import { useSort, type SortApi } from './useSort'

let sortApi: SortApi
let filtersApi: FiltersApi

function Probe() {
  const sort = useSort()
  const filters = useFilters()
  useEffect(() => {
    sortApi = sort
    filtersApi = filters
  })
  return null
}

function renderAt(path: string, previous: string[] = []) {
  return renderWithRouter(<Probe />, { path, previous })
}

it('reads the sort from the URL', () => {
  renderAt('/?sort=price_premises&order=asc')
  expect(sortApi.sort).toEqual({ field: 'price_premises', order: 'asc' })
})

it('writes the sort after the filters as a pushed entry', async () => {
  const { router } = renderAt('/?rooms=2')
  act(() => sortApi.setSort({ field: 'price_premises', order: 'asc' }))
  await waitFor(() =>
    expect(router.state.location.search).toBe('?rooms=2&sort=price_premises&order=asc'),
  )
  expect(router.state.historyAction).toBe('PUSH')
})

it('drops the params for the default sort', async () => {
  const { router } = renderAt('/?rooms=2&sort=price_premises&order=asc')
  act(() => sortApi.setSort({ field: 'transaction_date', order: 'desc' }))
  await waitFor(() => expect(router.state.location.search).toBe('?rooms=2'))
})

it('restores the previous sort on Back', async () => {
  const { router } = renderAt('/?sort=rooms&order=asc')
  act(() => sortApi.setSort({ field: 'rooms', order: 'desc' }))
  await waitFor(() => expect(router.state.location.search).toBe('?sort=rooms'))
  await act(() => router.navigate(-1))
  expect(router.state.location.search).toBe('?sort=rooms&order=asc')
  expect(sortApi.sort).toEqual({ field: 'rooms', order: 'asc' })
})

it('does not navigate when the sort stays equal', () => {
  const { router } = renderAt('/?sort=rooms')
  const before = router.state.location
  act(() => sortApi.setSort({ field: 'rooms', order: 'desc' }))
  expect(router.state.location).toBe(before)
})

it('keeps the sort when a filter changes afterwards', async () => {
  const { router } = renderAt('/')
  act(() => sortApi.setSort({ field: 'area_usable', order: 'asc' }))
  await waitFor(() => expect(router.state.location.search).toBe('?sort=area_usable&order=asc'))
  act(() => filtersApi.updateFilters({ rooms: [3] }, { history: 'push' }))
  await waitFor(() =>
    expect(router.state.location.search).toBe('?rooms=3&sort=area_usable&order=asc'),
  )
})
