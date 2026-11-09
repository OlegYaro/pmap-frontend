import { z } from 'zod'
import { EXCLUSION_REASONS } from '../../filters/model'

/** A number as typed: digits with an optional sign and a dot or comma decimal part. */
const NUMBER = /^[+-]?\d+(?:[.,]\d+)?$/
const WHOLE = /^[+-]?\d+$/
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** The typed number, or NaN when the text is not a number. Empty text is not handled here. */
export function parseNumber(text: string): number {
  const trimmed = text.trim()
  return NUMBER.test(trimmed) ? Number(trimmed.replace(',', '.')) : Number.NaN
}

/** True for a `YYYY-MM-DD` text that names a real calendar day. */
export function isCalendarDate(text: string): boolean {
  const match = DATE.exec(text)
  if (!match) return false
  const [year, month, day] = match.slice(1).map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  )
}

const text = z.string().trim()

/** Trimmed text that is empty or passes `check`. */
const optional = (check: (value: string) => boolean, message: string) =>
  text.refine((value) => value === '' || check(value), message)

const isKnownStatus = (value: string) => (EXCLUSION_REASONS as readonly string[]).includes(value)

/**
 * The transaction form over the typed strings. It mirrors the backend limits: powiat `^\d{4}$`
 * (required), gmina `^\d{7}$`, price and area > 0, whole rooms >= 1, a whole floor and a real date.
 * `status` is `clean` or a known exclusion reason; `storedStatus` (the value of an edited record)
 * is accepted too, so an unknown stored reason can be kept.
 */
export function transactionFormSchema(storedStatus?: string) {
  return z.object({
    powiat: text
      .min(1, { message: 'Choose a powiat', abort: true })
      .regex(/^\d{4}$/, 'A powiat code has 4 digits'),
    gmina: optional((value) => /^\d{7}$/.test(value), 'A gmina code has 7 digits'),
    city: text,
    district: text,
    address: text,
    date: optional(isCalendarDate, 'Enter a valid date'),
    price: optional((value) => parseNumber(value) > 0, 'Enter a price greater than 0'),
    area: optional((value) => parseNumber(value) > 0, 'Enter an area greater than 0'),
    rooms: optional(
      (value) => WHOLE.test(value) && Number(value) >= 1,
      'Enter a whole number of at least 1',
    ),
    floor: optional((value) => WHOLE.test(value), 'Enter a whole number'),
    market: text,
    function: text,
    buildingId: text,
    status: z
      .string()
      .refine((value) => isKnownStatus(value) || value === storedStatus, 'Choose a status'),
  })
}

/** The form state: every field as the typed string. `status` is `clean` for no exclusion reason. */
export type FormValues = z.input<ReturnType<typeof transactionFormSchema>>

export type FormField = keyof FormValues

/** Fields in the order of the form, used to focus the first one with an error. */
export const FORM_FIELDS = [
  'powiat',
  'gmina',
  'city',
  'district',
  'address',
  'date',
  'price',
  'area',
  'rooms',
  'floor',
  'market',
  'function',
  'buildingId',
  'status',
] as const satisfies readonly FormField[]

/** An empty form: the values of a new transaction. */
export const EMPTY_FORM: FormValues = {
  powiat: '',
  gmina: '',
  city: '',
  district: '',
  address: '',
  date: '',
  price: '',
  area: '',
  rooms: '',
  floor: '',
  market: '',
  function: '',
  buildingId: '',
  status: 'clean',
}
