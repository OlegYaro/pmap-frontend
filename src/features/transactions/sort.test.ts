import { describe, expect, it } from 'vitest'
import { DEFAULT_SORT, nextSort, parseSort, SORT_FIELDS, writeSort } from './sort'

const parse = (search: string) => parseSort(new URLSearchParams(search))

describe('parseSort', () => {
  it('defaults to transaction_date desc', () => {
    expect(parse('')).toEqual({ field: 'transaction_date', order: 'desc' })
  })

  it('reads a shared link', () => {
    expect(parse('?sort=price_premises&order=asc')).toEqual({
      field: 'price_premises',
      order: 'asc',
    })
  })

  it('accepts a field without a column and defaults the order', () => {
    expect(parse('?sort=updated_at')).toEqual({ field: 'updated_at', order: 'desc' })
  })

  it('ignores unknown values', () => {
    expect(parse('?sort=price&order=up')).toEqual(DEFAULT_SORT)
  })

  it('validates each param on its own', () => {
    expect(parse('?sort=bogus&order=asc')).toEqual({ field: 'transaction_date', order: 'asc' })
    expect(parse('?sort=rooms&order=up')).toEqual({ field: 'rooms', order: 'desc' })
  })

  it('accepts all 14 API fields', () => {
    expect(SORT_FIELDS).toHaveLength(14)
    for (const field of SORT_FIELDS) expect(parse(`?sort=${field}`).field).toBe(field)
  })
})

describe('writeSort', () => {
  it('keeps the filters and writes sort and order after them', () => {
    const params = writeSort(new URLSearchParams('order=desc&rooms=2&city_name=Krak%C3%B3w'), {
      field: 'price_premises',
      order: 'asc',
    })
    expect(params.toString()).toBe('rooms=2&city_name=Krak%C3%B3w&sort=price_premises&order=asc')
  })

  it('leaves out the defaults', () => {
    const params = writeSort(
      new URLSearchParams('rooms=2&sort=price_premises&order=asc'),
      DEFAULT_SORT,
    )
    expect(params.toString()).toBe('rooms=2')
  })

  it('writes only the value that differs from the default', () => {
    expect(
      writeSort(new URLSearchParams(), { field: 'transaction_date', order: 'asc' }).toString(),
    ).toBe('order=asc')
    expect(writeSort(new URLSearchParams(), { field: 'rooms', order: 'desc' }).toString()).toBe(
      'sort=rooms',
    )
  })

  it('does not change the given params', () => {
    const params = new URLSearchParams('sort=rooms')
    writeSort(params, DEFAULT_SORT)
    expect(params.toString()).toBe('sort=rooms')
  })
})

describe('nextSort', () => {
  it('flips the order of the sorted field', () => {
    expect(nextSort(DEFAULT_SORT, 'transaction_date')).toEqual({
      field: 'transaction_date',
      order: 'asc',
    })
    expect(nextSort({ field: 'rooms', order: 'asc' }, 'rooms')).toEqual({
      field: 'rooms',
      order: 'desc',
    })
  })

  it('starts another field ascending', () => {
    expect(nextSort(DEFAULT_SORT, 'price_premises')).toEqual({
      field: 'price_premises',
      order: 'asc',
    })
  })
})
