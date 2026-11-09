import { afterEach, expect, it, vi } from 'vitest'
import {
  completePeriod,
  defaultPeriod,
  matchPreset,
  monthsBefore,
  periodPreset,
  today,
} from './period'

afterEach(() => {
  vi.useRealTimers()
})

it('reads today from the system clock', () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 7, 12))
  expect(today()).toBe('2026-11-07')
})

it('goes back by calendar months', () => {
  expect(monthsBefore('2026-11-07', 3)).toBe('2026-08-07')
  expect(monthsBefore('2026-11-07', 12)).toBe('2025-11-07')
  expect(monthsBefore('2026-11-07', 36)).toBe('2023-11-07')
})

it('clamps to the last day of a shorter month', () => {
  expect(monthsBefore('2026-08-31', 6)).toBe('2026-02-28')
  expect(monthsBefore('2024-08-31', 6)).toBe('2024-02-29')
  expect(monthsBefore('2026-05-31', 1)).toBe('2026-04-30')
})

it('handles a leap day', () => {
  expect(monthsBefore('2024-02-29', 12)).toBe('2023-02-28')
  expect(monthsBefore('2028-02-29', 48)).toBe('2024-02-29')
})

it('crosses a year boundary', () => {
  expect(monthsBefore('2026-01-15', 1)).toBe('2025-12-15')
  expect(monthsBefore('2026-02-10', 3)).toBe('2025-11-10')
})

it('builds a preset and the default period ending today', () => {
  expect(periodPreset('2026-11-07', 3)).toEqual({ date_from: '2026-08-07', date_to: '2026-11-07' })
  expect(defaultPeriod('2026-11-07')).toEqual({ date_from: '2025-11-07', date_to: '2026-11-07' })
})

it('completes a period with one end missing', () => {
  expect(completePeriod({ date_from: '2024-01-01' }, '2026-11-07')).toEqual({
    date_from: '2024-01-01',
    date_to: '2026-11-07',
  })
  expect(completePeriod({ date_to: '2024-06-30' }, '2026-11-07')).toEqual({
    date_from: '2023-06-30',
    date_to: '2024-06-30',
  })
  expect(completePeriod({}, '2026-11-07')).toEqual(defaultPeriod('2026-11-07'))
})

it('matches the preset of the period', () => {
  expect(matchPreset({ date_from: '2026-08-07', date_to: '2026-11-07' }, '2026-11-07')).toBe(3)
  expect(matchPreset({ date_from: '2023-11-07', date_to: '2026-11-07' }, '2026-11-07')).toBe(36)
  expect(matchPreset({ date_from: '2026-02-28', date_to: '2026-08-31' }, '2026-08-31')).toBe(6)
})

it('marks any other period as custom', () => {
  expect(matchPreset({ date_from: '2024-01-01', date_to: '2024-06-30' }, '2026-11-07')).toBe(
    'custom',
  )
  // A preset of an earlier day no longer matches.
  expect(matchPreset({ date_from: '2026-08-06', date_to: '2026-11-06' }, '2026-11-07')).toBe(
    'custom',
  )
  expect(matchPreset({}, '2026-11-07')).toBe('custom')
})

it('uses the system date by default', () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 7, 12))
  expect(matchPreset({ date_from: '2025-11-07', date_to: '2026-11-07' })).toBe(12)
})
