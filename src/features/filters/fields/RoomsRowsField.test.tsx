import { act, fireEvent, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderWithDraft } from '../../../test/render'
import { RoomsField } from './RoomsField'
import { rowsSummary } from '../labels'
import { RowsField } from './RowsField'

async function click(element: HTMLElement) {
  await act(async () => {
    fireEvent.click(element)
  })
}

const search = () => click(screen.getByRole('button', { name: 'Search' }))

const box = (name: string) => screen.getByRole('checkbox', { name })

it('checks "2" and "5+" in the draft and writes the URL on search', async () => {
  const { router } = renderWithDraft(<RoomsField />, { previous: ['/analytics'] })
  await click(box('2 rooms'))
  await click(box('5+ rooms'))
  expect(box('5+ rooms')).toBeChecked()
  expect(router.state.location.search).toBe('')
  await search()
  expect(router.state.location.search).toBe(
    '?rooms=2&rooms=5&rooms=6&rooms=7&rooms=8&rooms=9&rooms=10',
  )
  expect(router.state.historyAction).toBe('PUSH')
  await act(() => router.navigate(-1))
  expect(router.state.location.pathname).toBe('/')
  expect(router.state.location.search).toBe('')
})

it('shows "5+" for any count of five or more and unchecks all of them', async () => {
  const { router } = renderWithDraft(<RoomsField />, { path: '/?rooms=2&rooms=7' })
  expect(box('2 rooms')).toBeChecked()
  expect(box('5+ rooms')).toBeChecked()
  expect(box('3 rooms')).not.toBeChecked()
  await click(box('5+ rooms'))
  expect(router.state.location.search).toBe('?rooms=2&rooms=7')
  await search()
  expect(router.state.location.search).toBe('?rooms=2')
})

it('removes the rooms filter when the last box is unchecked', async () => {
  const { router } = renderWithDraft(<RoomsField />, { path: '/?rooms=3' })
  await click(box('3 rooms'))
  await search()
  expect(router.state.location.search).toBe('')
})

function rowsTrigger() {
  return screen.getByRole('button', { name: /^Rows/ })
}

it('filters clean rows only', async () => {
  const { router } = renderWithDraft(<RowsField />)
  expect(rowsTrigger()).toHaveAccessibleName('Rows All rows')
  await click(rowsTrigger())
  await click(box('Clean'))
  expect(router.state.location.search).toBe('')
  expect(rowsTrigger()).toHaveAccessibleName('Rows Clean only')
  await search()
  expect(router.state.location.search).toBe('?exclusion_reason=clean')
  expect(router.state.historyAction).toBe('PUSH')
})

it('summarises several reasons', async () => {
  const { router } = renderWithDraft(<RowsField />)
  await click(rowsTrigger())
  await click(box('Package deal'))
  await click(box('Non-market'))
  await search()
  expect(router.state.location.search).toBe(
    '?exclusion_reason=package_deal&exclusion_reason=non_market',
  )
  expect(rowsTrigger()).toHaveAccessibleName('Rows 2 selected')
  await click(box('Package deal'))
  await click(box('Non-market'))
  await search()
  expect(router.state.location.search).toBe('')
})

it('summarises the row choice', () => {
  expect(rowsSummary([])).toBe('All rows')
  expect(rowsSummary(['clean'])).toBe('Clean only')
  expect(rowsSummary(['package_deal'])).toBe('Package deal')
  expect(rowsSummary(['clean', 'package_deal'])).toBe('2 selected')
})
