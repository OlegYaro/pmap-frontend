const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })
// Calendar dates are built and formatted in UTC, so the result never depends on the time zone.
const dateFormat = new Intl.DateTimeFormat(undefined, { timeZone: 'UTC' })

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

/** Shown in place of a missing value. */
export const EMPTY = '—'

/** `format(value)`, or `EMPTY` when the value is null or undefined (0 and '' are formatted). */
export function orEmpty<T>(value: T | null | undefined, format: (value: T) => string): string {
  return value === null || value === undefined ? EMPTY : format(value)
}
