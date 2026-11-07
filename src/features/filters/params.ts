import {
  EXCLUSION_REASONS,
  FILTER_KEYS,
  type ExclusionReason,
  type TransactionFilters,
} from './model'

const NON_NEGATIVE = /^\d+(\.\d+)?$/
const INTEGER = /^-?\d+$/
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const VOIVODESHIP_CODE = /^\d{2}$/
const POWIAT_CODE = /^\d{4}$/
const GMINA_CODE = /^\d{7}$/
const MAX_ROOMS = 99

/** Trimmed text, or undefined when empty. */
export function parseText(raw: string): string | undefined {
  const text = raw.trim()
  return text === '' ? undefined : text
}

/** A finite decimal number >= 0 written with a dot, or undefined. */
export function parseNonNegative(raw: string): number | undefined {
  const text = raw.trim()
  if (!NON_NEGATIVE.test(text)) return undefined
  const value = Number(text)
  return Number.isFinite(value) ? value : undefined
}

/** A safe integer (negative allowed), or undefined. */
export function parseInteger(raw: string): number | undefined {
  const text = raw.trim()
  if (!INTEGER.test(text)) return undefined
  const value = Number(text)
  return Number.isSafeInteger(value) ? value : undefined
}

/** A `YYYY-MM-DD` string naming a real calendar date, or undefined. */
export function parseIsoDate(raw: string): string | undefined {
  const text = raw.trim()
  const match = ISO_DATE.exec(text)
  if (!match) return undefined
  const [year, month, day] = match.slice(1).map(Number)
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  const real =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  return real ? text : undefined
}

function matching(pattern: RegExp) {
  return (raw: string) => {
    const text = raw.trim()
    return pattern.test(text) ? text : undefined
  }
}

function parseRunId(raw: string): string | undefined {
  const text = raw.trim()
  return UUID.test(text) ? text.toLowerCase() : undefined
}

function parseRoom(raw: string): number | undefined {
  const value = parseInteger(raw)
  return value !== undefined && value >= 1 && value <= MAX_ROOMS ? value : undefined
}

function first<T>(params: URLSearchParams, key: string, parse: (raw: string) => T | undefined) {
  for (const raw of params.getAll(key)) {
    const value = parse(raw)
    if (value !== undefined) return value
  }
  return undefined
}

/**
 * Keeps the territory codes consistent: a child that does not extend a given parent is dropped with
 * its own children, and a missing parent is filled from the child's prefix.
 */
function normalizeTerritory(filters: TransactionFilters): void {
  let { voivodeship_code: voivodeship, powiat_code: powiat, gmina_code: gmina } = filters
  if (powiat !== undefined && voivodeship !== undefined && !powiat.startsWith(voivodeship)) {
    powiat = undefined
    gmina = undefined
  }
  if (gmina !== undefined) {
    const parent = powiat ?? voivodeship
    if (parent !== undefined && !gmina.startsWith(parent)) gmina = undefined
  }
  if (gmina !== undefined && powiat === undefined) powiat = gmina.slice(0, 4)
  if (powiat !== undefined && voivodeship === undefined) voivodeship = powiat.slice(0, 2)
  delete filters.voivodeship_code
  delete filters.powiat_code
  delete filters.gmina_code
  if (voivodeship !== undefined) filters.voivodeship_code = voivodeship
  if (powiat !== undefined) filters.powiat_code = powiat
  if (gmina !== undefined) filters.gmina_code = gmina
}

/** Reads the filters from URL search params. Unknown keys, empty and malformed values are ignored. */
export function parseFilters(params: URLSearchParams): TransactionFilters {
  const filters: TransactionFilters = {}
  const put = <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) => {
    if (value !== undefined) filters[key] = value
  }

  put('voivodeship_code', first(params, 'voivodeship_code', matching(VOIVODESHIP_CODE)))
  put('powiat_code', first(params, 'powiat_code', matching(POWIAT_CODE)))
  put('gmina_code', first(params, 'gmina_code', matching(GMINA_CODE)))
  normalizeTerritory(filters)

  put('city_name', first(params, 'city_name', parseText))
  put('district_name', first(params, 'district_name', parseText))
  put('date_from', first(params, 'date_from', parseIsoDate))
  put('date_to', first(params, 'date_to', parseIsoDate))
  put('price_min', first(params, 'price_min', parseNonNegative))
  put('price_max', first(params, 'price_max', parseNonNegative))
  put('area_min', first(params, 'area_min', parseNonNegative))
  put('area_max', first(params, 'area_max', parseNonNegative))

  const rooms = new Set<number>()
  for (const raw of params.getAll('rooms')) {
    const room = parseRoom(raw)
    if (room !== undefined) rooms.add(room)
  }
  if (rooms.size > 0) filters.rooms = [...rooms].sort((a, b) => a - b)

  put('floor_min', first(params, 'floor_min', parseInteger))
  put('floor_max', first(params, 'floor_max', parseInteger))
  put('function', first(params, 'function', parseText))
  put('address', first(params, 'address', parseText))

  const reasons = new Set(params.getAll('exclusion_reason').map((raw) => raw.trim()))
  const known = EXCLUSION_REASONS.filter((reason: ExclusionReason) => reasons.has(reason))
  if (known.length > 0) filters.exclusion_reason = known

  put('run_id', first(params, 'run_id', parseRunId))
  return filters
}

/**
 * Writes the filters as search params: only filter keys with a value, in canonical order, one
 * repeated param per array item.
 */
export function serializeFilters(filters: TransactionFilters): URLSearchParams {
  const params = new URLSearchParams()
  for (const key of FILTER_KEYS) {
    const value = filters[key]
    if (value === undefined) continue
    const items: readonly (string | number)[] = Array.isArray(value) ? value : [value]
    for (const item of items) {
      const text = typeof item === 'string' ? item.trim() : String(item)
      if (text !== '') params.append(key, text)
    }
  }
  return params
}

/** True when both filter objects give the same URL. */
export function sameFilters(a: TransactionFilters, b: TransactionFilters): boolean {
  return serializeFilters(a).toString() === serializeFilters(b).toString()
}
