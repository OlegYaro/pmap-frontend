import { act, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { expect, it } from 'vitest'
import { renderWithRouter } from '../../test/render'
import { parseLimit, parseRunId, parseTab, useAdminParams } from './useAdminParams'

let params: ReturnType<typeof useAdminParams>

function Probe() {
  const result = useAdminParams()
  useEffect(() => {
    params = result
  })
  return <p>{`${result.tab} ${result.limit} ${result.runId ?? 'none'}`}</p>
}

it.each([
  [null, 'runs'],
  ['runs', 'runs'],
  ['transactions', 'transactions'],
  ['nope', 'runs'],
  ['', 'runs'],
])('reads tab %j as %s', (value, tab) => {
  expect(parseTab(value)).toBe(tab)
})

it.each([
  [null, 20],
  ['20', 20],
  ['50', 50],
  ['100', 100],
  ['30', 20],
  ['50.0', 20],
  ['abc', 20],
])('reads limit %j as %i', (value, limit) => {
  expect(parseLimit(value)).toBe(limit)
})

it('reads a run id and treats a blank one as none', () => {
  expect(parseRunId('r1')).toBe('r1')
  expect(parseRunId(null)).toBeNull()
  expect(parseRunId('  ')).toBeNull()
})

it('reads the defaults from an empty URL', () => {
  renderWithRouter(<Probe />, { path: '/admin' })
  expect(screen.getByText('runs 20 none')).toBeInTheDocument()
})

it('reads valid values from the URL', () => {
  renderWithRouter(<Probe />, { path: '/admin?tab=transactions&limit=100&run=r1' })
  expect(screen.getByText('transactions 100 r1')).toBeInTheDocument()
})

it('falls back to the defaults for invalid values', () => {
  renderWithRouter(<Probe />, { path: '/admin?tab=nope&limit=7&run=' })
  expect(screen.getByText('runs 20 none')).toBeInTheDocument()
})

it('pushes the tab and the limit and keeps the other params', () => {
  const { router } = renderWithRouter(<Probe />, { path: '/admin?run=r1' })

  act(() => params.setTab('transactions'))
  expect(router.state.location.search).toBe('?run=r1&tab=transactions')
  expect(router.state.historyAction).toBe('PUSH')

  act(() => params.setLimit(50))
  expect(router.state.location.search).toBe('?run=r1&tab=transactions&limit=50')
  expect(router.state.historyAction).toBe('PUSH')
})

it('writes nothing when the tab or the limit does not change', () => {
  const { router } = renderWithRouter(<Probe />, { path: '/admin?tab=nope' })
  act(() => params.setTab('runs'))
  act(() => params.setLimit(20))
  expect(router.state.location.search).toBe('?tab=nope')
  expect(router.state.historyAction).toBe('POP')
})

it('replaces the history entry when a run is selected', () => {
  const { router } = renderWithRouter(<Probe />, { path: '/admin?limit=50', previous: ['/'] })
  act(() => params.selectRun('r2'))
  expect(router.state.location.search).toBe('?limit=50&run=r2')
  expect(router.state.historyAction).toBe('REPLACE')
  expect(screen.getByText('runs 50 r2')).toBeInTheDocument()
})
