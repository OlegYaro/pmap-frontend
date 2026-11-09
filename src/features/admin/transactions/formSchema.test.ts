import { describe, expect, it } from 'vitest'
import {
  EMPTY_FORM,
  FORM_FIELDS,
  isCalendarDate,
  parseNumber,
  transactionFormSchema,
  type FormField,
  type FormValues,
} from './formSchema'

const VALID: FormValues = { ...EMPTY_FORM, powiat: '0264' }

/** The messages of the field after parsing the valid form with `changes`. */
function errorsOf(field: FormField, changes: Partial<FormValues>, storedStatus?: string) {
  const result = transactionFormSchema(storedStatus).safeParse({ ...VALID, ...changes })
  if (result.success) return []
  return result.error.issues.filter((issue) => issue.path[0] === field).map((i) => i.message)
}

const valid = (field: FormField, value: string) =>
  expect(errorsOf(field, { [field]: value })).toEqual([])
const invalid = (field: FormField, value: string, message: string) =>
  expect(errorsOf(field, { [field]: value })).toEqual([message])

describe('transactionFormSchema', () => {
  it('accepts the empty form with a powiat', () => {
    expect(transactionFormSchema().safeParse(VALID).success).toBe(true)
  })

  it('lists every field in form order', () => {
    expect(Object.keys(EMPTY_FORM)).toEqual([...FORM_FIELDS])
  })

  it('requires a 4-digit powiat with one message', () => {
    invalid('powiat', '', 'Choose a powiat')
    invalid('powiat', '   ', 'Choose a powiat')
    invalid('powiat', '026', 'A powiat code has 4 digits')
    invalid('powiat', '02a4', 'A powiat code has 4 digits')
    valid('powiat', ' 0264 ')
  })

  it('accepts an empty gmina or 7 digits', () => {
    valid('gmina', '')
    valid('gmina', '0264011')
    invalid('gmina', '026401', 'A gmina code has 7 digits')
  })

  it('accepts a positive price and area, with a dot or a comma', () => {
    valid('price', '')
    valid('price', '450000')
    valid('price', '0.5')
    invalid('price', '0', 'Enter a price greater than 0')
    invalid('price', '-1', 'Enter a price greater than 0')
    invalid('price', 'abc', 'Enter a price greater than 0')
    valid('area', '52,5')
    invalid('area', '0', 'Enter an area greater than 0')
    invalid('area', '1e3', 'Enter an area greater than 0')
  })

  it('accepts whole rooms of at least 1', () => {
    valid('rooms', '')
    valid('rooms', '3')
    invalid('rooms', '0', 'Enter a whole number of at least 1')
    invalid('rooms', '2.5', 'Enter a whole number of at least 1')
  })

  it('accepts a whole floor, also below ground', () => {
    valid('floor', '')
    valid('floor', '0')
    valid('floor', '-1')
    invalid('floor', '1.5', 'Enter a whole number')
    invalid('floor', 'first', 'Enter a whole number')
  })

  it('accepts a real calendar date only', () => {
    valid('date', '')
    valid('date', '2026-03-15')
    valid('date', '2024-02-29')
    invalid('date', '2025-02-29', 'Enter a valid date')
    invalid('date', '2026-13-01', 'Enter a valid date')
    invalid('date', '15.03.2026', 'Enter a valid date')
  })

  it('accepts clean, the known reasons and the stored status', () => {
    valid('status', 'clean')
    valid('status', 'non_market')
    invalid('status', 'odd_reason', 'Choose a status')
    expect(errorsOf('status', { status: 'odd_reason' }, 'odd_reason')).toEqual([])
  })

  it('trims the text fields', () => {
    const result = transactionFormSchema().parse({
      ...VALID,
      city: '  Bielsko ',
      district: ' Centrum',
      address: 'ul. Długa 1  ',
      buildingId: ' B-1 ',
    })
    expect(result).toMatchObject({
      city: 'Bielsko',
      district: 'Centrum',
      address: 'ul. Długa 1',
      buildingId: 'B-1',
    })
  })
})

describe('parseNumber', () => {
  it('reads dot and comma decimals and gives NaN for anything else', () => {
    expect(parseNumber(' 52,5 ')).toBe(52.5)
    expect(parseNumber('450000')).toBe(450000)
    expect(parseNumber('1e3')).toBeNaN()
    expect(parseNumber('')).toBeNaN()
  })
})

describe('isCalendarDate', () => {
  it('checks the day of the month on leap and other years', () => {
    expect(isCalendarDate('2024-02-29')).toBe(true)
    expect(isCalendarDate('2025-02-29')).toBe(false)
    expect(isCalendarDate('2026-04-31')).toBe(false)
  })
})
