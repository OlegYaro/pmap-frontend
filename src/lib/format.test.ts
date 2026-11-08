import { afterEach, expect, it, vi } from 'vitest'
import {
  EMPTY,
  formatArea,
  formatDateTime,
  formatIsoDate,
  formatMonth,
  formatNumber,
  formatPercent,
  formatPln,
  formatPlnPerM2,
  orEmpty,
  shortId,
} from './format'

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

it('formats a price per m² in whole złoty', () => {
  expect(formatPlnPerM2(11000)).toBe('11,000 PLN/m²')
  expect(formatPlnPerM2(10999.6)).toBe('11,000 PLN/m²')
  expect(formatPlnPerM2(10999.4)).toBe('10,999 PLN/m²')
  expect(formatPlnPerM2(0)).toBe('0 PLN/m²')
})

it('formats a percent with its sign and at most one decimal', () => {
  expect(formatPercent(10)).toBe('+10%')
  expect(formatPercent(-3.4)).toBe('-3.4%')
  expect(formatPercent(0)).toBe('0%')
  expect(formatPercent(2.46)).toBe('+2.5%')
  expect(formatPercent(-0.04)).toBe('0%')
})

it.each(['UTC', 'America/Los_Angeles', 'Pacific/Kiritimati'])(
  'formats a month without a shift in %s',
  (tz) => {
    vi.stubEnv('TZ', tz)
    expect(formatMonth('2025-03-01')).toBe('March 2025')
    expect(formatMonth('2025-03')).toBe('March 2025')
    expect(formatMonth('2025-01-01', 'short')).toBe('Jan 2025')
    expect(formatMonth('2024-12', 'short')).toBe('Dec 2024')
  },
)

it('returns a value that is not a month unchanged', () => {
  expect(formatMonth('March')).toBe('March')
  expect(formatMonth('2025-13-01')).toBe('2025-13-01')
})

it('formats a timestamp as a locale date and time', () => {
  expect(formatDateTime('2026-11-07T10:05:00')).toBe('11/7/2026, 10:05 AM')
  expect(formatDateTime('2026-01-31T23:59:59.123456')).toBe('1/31/2026, 11:59 PM')
})

it('shows an offset timestamp in the local time zone', () => {
  const instant = new Date('2026-11-07T10:05:00+00:00')
  const pad = (value: number) => String(value).padStart(2, '0')
  const local = `${instant.getFullYear()}-${pad(instant.getMonth() + 1)}-${pad(instant.getDate())}T${pad(instant.getHours())}:${pad(instant.getMinutes())}`
  expect(formatDateTime('2026-11-07T10:05:00+00:00')).toBe(formatDateTime(local))
})

it('returns a value that is not a timestamp unchanged', () => {
  expect(formatDateTime('yesterday')).toBe('yesterday')
  expect(formatDateTime('')).toBe('')
})

it('shortens an id to its first 8 characters', () => {
  expect(shortId('1a2b3c4d-0000-0000-0000-000000000000')).toBe('1a2b3c4d')
  expect(shortId('r1')).toBe('r1')
})
