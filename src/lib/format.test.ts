import { afterEach, expect, it, vi } from 'vitest'
import { EMPTY, formatArea, formatIsoDate, formatNumber, formatPln, orEmpty } from './format'

afterEach(() => {
  vi.unstubAllEnvs()
})

it('formats numbers, prices and areas in the locale', () => {
  expect(formatNumber(200000)).toBe('200,000')
  expect(formatNumber(42.567)).toBe('42.57')
  expect(formatPln(500000)).toBe('500,000 PLN')
  expect(formatArea(40)).toBe('40 m²')
  expect(formatArea(42.5)).toBe('42.5 m²')
})

it.each(['UTC', 'America/Los_Angeles', 'Pacific/Kiritimati'])(
  'formats an ISO date without a day shift in %s',
  (tz) => {
    vi.stubEnv('TZ', tz)
    expect(formatIsoDate('2024-12-31')).toBe('12/31/2024')
    expect(formatIsoDate('2024-01-01')).toBe('1/1/2024')
  },
)

it('returns a non-ISO value unchanged', () => {
  expect(formatIsoDate('31.12.2024')).toBe('31.12.2024')
})

it('shows a dash for a missing value and formats everything else', () => {
  expect(EMPTY).toBe('—')
  expect(orEmpty(null, formatNumber)).toBe('—')
  expect(orEmpty(undefined, formatNumber)).toBe('—')
  expect(orEmpty(0, formatNumber)).toBe('0')
  expect(orEmpty('wtorny', (text) => text.toUpperCase())).toBe('WTORNY')
})
