import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { renderWithRouter } from '../../test/render'
import { PeriodPresets } from './PeriodPresets'

function renderAt(path: string, onCustom = vi.fn()) {
  return { ...renderWithRouter(<PeriodPresets onCustom={onCustom} />, { path }), onCustom }
}

function setToday(year: number, month: number, day: number) {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(year, month - 1, day, 12))
}

const pressed = () =>
  screen
    .getAllByRole('button')
    .filter((button) => button.getAttribute('aria-pressed') === 'true')
    .map((button) => button.textContent)

afterEach(() => {
  vi.useRealTimers()
})

it('offers the five choices in order', () => {
  setToday(2026, 11, 7)
  renderAt('/analytics?date_from=2025-11-07&date_to=2026-11-07')
  expect(screen.getByRole('group', { name: 'Period' })).toBeInTheDocument()
  expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
    '3 months',
    '6 months',
    '12 months',
    '3 years',
    'Custom',
  ])
  expect(pressed()).toEqual(['12 months'])
})

it('applies "3 months" at once as a pushed entry and marks it', async () => {
  setToday(2026, 11, 7)
  const { router } = renderAt('/analytics?date_from=2025-11-07&date_to=2026-11-07&rooms=2')
  fireEvent.click(screen.getByRole('button', { name: '3 months' }))
  await waitFor(() =>
    expect(router.state.location.search).toBe('?date_from=2026-08-07&date_to=2026-11-07&rooms=2'),
  )
  expect(router.state.historyAction).toBe('PUSH')
  expect(pressed()).toEqual(['3 months'])
})

it('clamps to the end of a shorter month', async () => {
  setToday(2026, 8, 31)
  const { router } = renderAt('/analytics?date_from=2025-08-31&date_to=2026-08-31')
  fireEvent.click(screen.getByRole('button', { name: '6 months' }))
  await waitFor(() =>
    expect(router.state.location.search).toBe('?date_from=2026-02-28&date_to=2026-08-31'),
  )
  expect(pressed()).toEqual(['6 months'])
})

it('marks "Custom" for a period that matches no preset', () => {
  setToday(2026, 11, 7)
  renderAt('/analytics?date_from=2024-01-01&date_to=2024-06-30')
  expect(pressed()).toEqual(['Custom'])
})

it('keeps the period on "Custom" and asks the page to focus the inputs', () => {
  setToday(2026, 11, 7)
  const { router, onCustom } = renderAt('/analytics?date_from=2026-08-07&date_to=2026-11-07')
  fireEvent.click(screen.getByRole('button', { name: 'Custom' }))
  expect(onCustom).toHaveBeenCalledTimes(1)
  expect(router.state.location.search).toBe('?date_from=2026-08-07&date_to=2026-11-07')
  expect(pressed()).toEqual(['3 months'])
})
