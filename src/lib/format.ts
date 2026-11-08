const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })
const wholeFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 })
const percentFormat = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
})
// Calendar dates are built and formatted in UTC, so the result never depends on the time zone.
const dateFormat = new Intl.DateTimeFormat(undefined, { timeZone: 'UTC' })
// Timestamps are shown in the user's own time zone.
const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})
const monthFormats = {
  long: new Intl.DateTimeFormat(undefined, { timeZone: 'UTC', month: 'long', year: 'numeric' }),
  short: new Intl.DateTimeFormat(undefined, { timeZone: 'UTC', month: 'short', year: 'numeric' }),
}

/** A number in the user's locale, at most two decimals: `200000` → `200,000` in en-US. */
export function formatNumber(value: number): string {
  return numberFormat.format(value)
}

/** An amount in Polish złoty: `500000` → `500,000 PLN` in en-US. */
export function formatPln(value: number): string {
  return `${formatNumber(value)} PLN`
}

/** An area in square metres: `40` → `40 m²`. */
export function formatArea(value: number): string {
  return `${formatNumber(value)} m²`
}

/** A price per square metre in whole złoty: `10999.6` → `11,000 PLN/m²` in en-US. */
export function formatPlnPerM2(value: number): string {
  return `${wholeFormat.format(value)} PLN/m²`
}

/** A percent value with its sign and at most one decimal: `10` → `+10%`, `-3.4` → `-3.4%`, `0` → `0%`. */
export function formatPercent(value: number): string {
  return `${percentFormat.format(value)}%`
}

/**
 * The month of a `YYYY-MM` or `YYYY-MM-DD` value in UTC: `March 2025` (long) or `Mar 2025` (short)
 * in en-US. Anything else is returned unchanged.
 */
export function formatMonth(value: string, style: 'long' | 'short' = 'long'): string {
  const match = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(value)
  if (!match) return value
  const [year, month] = match.slice(1).map(Number)
  if (month < 1 || month > 12) return value
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, 1)
  return monthFormats[style].format(date)
}

/**
 * A `YYYY-MM-DD` date as a locale date, without a day shift in any time zone. Anything else is
 * returned unchanged.
 */
export function formatIsoDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return iso
  const [year, month, day] = match.slice(1).map(Number)
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  return dateFormat.format(date)
}

/**
 * An ISO timestamp as a locale date and time in the user's time zone:
 * `2026-11-07T10:05:00` → `11/7/2026, 10:05 AM` in en-US. Anything else is returned unchanged.
 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : dateTimeFormat.format(date)
}

/** The first 8 characters of an id, enough to tell runs apart: `1a2b3c4d-…` → `1a2b3c4d`. */
export function shortId(id: string): string {
  return id.slice(0, 8)
}

/** Shown in place of a missing value. */
export const EMPTY = '—'

/** `format(value)`, or `EMPTY` when the value is null or undefined (0 and '' are formatted). */
export function orEmpty<T>(value: T | null | undefined, format: (value: T) => string): string {
  return value === null || value === undefined ? EMPTY : format(value)
}
