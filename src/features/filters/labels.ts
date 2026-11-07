import type { ExclusionReason } from './model'

/** Readable names of the known `market_type` values; the data has two spellings of each. */
export const MARKET_TYPE_LABELS: Readonly<Record<string, string>> = {
  pierwotny: 'Primary',
  rynekPierwotny: 'Primary',
  wtorny: 'Secondary',
  rynekWtorny: 'Secondary',
}

/** Readable names of the known `function` values. */
export const FUNCTION_LABELS: Readonly<Record<string, string>> = {
  mieszkalna: 'Residential',
  garaz: 'Garage',
  inne: 'Other',
  handlowoUslugowa: 'Retail and services',
  biurowa: 'Office',
  produkcyjna: 'Industrial',
}

/** Readable names of the row statuses (`clean` or an exclusion reason). */
export const EXCLUSION_REASON_LABELS: Readonly<Record<ExclusionReason, string>> = {
  clean: 'Clean',
  fractional_share: 'Fractional share',
  package_deal: 'Package deal',
  non_market: 'Non-market',
  missing_fields: 'Missing fields',
  implausible_area: 'Implausible area',
  unassigned: 'Unassigned',
  no_city_district: 'No city / district',
  implausible_price: 'Implausible price',
}

/** The readable name of `value`, or the value itself when it is not known. */
export function labelFor(labels: Readonly<Record<string, string>>, value: string): string {
  return Object.hasOwn(labels, value) ? labels[value] : value
}

/** "All rows", "Clean only", the one reason's label, or "<n> selected". */
export function rowsSummary(reasons: readonly ExclusionReason[]): string {
  if (reasons.length === 0) return 'All rows'
  if (reasons.length > 1) return `${reasons.length} selected`
  return reasons[0] === 'clean' ? 'Clean only' : EXCLUSION_REASON_LABELS[reasons[0]]
}
