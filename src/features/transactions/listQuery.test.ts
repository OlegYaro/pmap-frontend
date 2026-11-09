import { describe, expect, it } from 'vitest'
import { transactionPage, transactionRow } from '../../test/transactions'
import { buildListQuery, listQueryKey, nextCursor, PAGE_SIZE, readPageCursors } from './listQuery'
import { DEFAULT_SORT, type ListSort } from './sort'

/** A full page whose last row is `last`. */
function fullPageEndingWith(last: ReturnType<typeof transactionRow>) {
  return [...transactionPage(PAGE_SIZE - 1), last]
}

describe('buildListQuery', () => {
  it('sends filters, sort and limit for the first page and nothing else', () => {
    expect(
      buildListQuery(
        { powiat_code: '0264', rooms: [2, 3] },
        { field: 'price_premises', order: 'asc' },
        null,
      ),
    ).toEqual({
      powiat_code: '0264',
      rooms: [2, 3],
      sort: 'price_premises',
      order: 'asc',
      limit: 50,
    })
  })

  it('always sends the default sort', () => {
    expect(buildListQuery({}, DEFAULT_SORT, null)).toEqual({
      sort: 'transaction_date',
      order: 'desc',
      limit: 50,
    })
  })

  it('adds the cursor for a later page', () => {
    expect(buildListQuery({}, DEFAULT_SORT, { after_id: 7, after_value: '2024-05-17' })).toEqual({
      sort: 'transaction_date',
      order: 'desc',
      limit: 50,
      after_id: 7,
      after_value: '2024-05-17',
    })
  })
})

describe('nextCursor', () => {
  const by = (field: ListSort['field']): ListSort => ({ field, order: 'desc' })

  it('uses the date of the last row', () => {
    const page = fullPageEndingWith(transactionRow({ id: 731, transaction_date: '2024-05-17' }))
    expect(nextCursor(page, by('transaction_date'))).toEqual({
      after_id: 731,
      after_value: '2024-05-17',
    })
  })

  it('writes numbers in plain decimal form', () => {
    const page = fullPageEndingWith(transactionRow({ id: 12, price_premises: 455000.5 }))
    expect(nextCursor(page, by('price_premises'))).toEqual({
      after_id: 12,
      after_value: '455000.5',
    })
  })

  it('writes a zero value', () => {
    const page = fullPageEndingWith(transactionRow({ id: 3, floor: 0 }))
    expect(nextCursor(page, by('floor'))).toEqual({ after_id: 3, after_value: '0' })
  })

  it('leaves out a null sort value', () => {
    const page = fullPageEndingWith(transactionRow({ id: 90, district_name: null }))
    expect(nextCursor(page, by('district_name'))).toEqual({ after_id: 90 })
  })

  it('leaves out the value when sorting by id', () => {
    const page = fullPageEndingWith(transactionRow({ id: 500 }))
    expect(nextCursor(page, by('id'))).toEqual({ after_id: 500 })
  })

  it('ends after a short or empty page', () => {
    expect(nextCursor(transactionPage(37), DEFAULT_SORT)).toBeUndefined()
    expect(nextCursor([], DEFAULT_SORT)).toBeUndefined()
  })

  it('continues after a full page', () => {
    expect(nextCursor(transactionPage(100), DEFAULT_SORT)).toMatchObject({ after_id: 100 })
  })
})

describe('listQueryKey', () => {
  it('is equal for equal filters given in a different order', () => {
    const a = listQueryKey({ rooms: [2], city_name: 'Łódź' }, DEFAULT_SORT)
    const b = listQueryKey({ city_name: 'Łódź', rooms: [2] }, DEFAULT_SORT)
    expect(a).toEqual(b)
  })

  it('differs by sort', () => {
    expect(listQueryKey({}, DEFAULT_SORT)).not.toEqual(
      listQueryKey({}, { field: 'transaction_date', order: 'asc' }),
    )
  })
})

describe('readPageCursors', () => {
  it('reads a stack of cursors', () => {
    expect(
      readPageCursors({
        pageCursors: [{ after_id: 5, after_value: '2024-01-02' }, { after_id: 9 }],
      }),
    ).toEqual([{ after_id: 5, after_value: '2024-01-02' }, { after_id: 9 }])
  })

  it('treats missing or malformed state as page 1', () => {
    expect(readPageCursors(null)).toEqual([])
    expect(readPageCursors(undefined)).toEqual([])
    expect(readPageCursors('x')).toEqual([])
    expect(readPageCursors({})).toEqual([])
    expect(readPageCursors({ pageCursors: 'x' })).toEqual([])
    expect(readPageCursors({ pageCursors: [{ after_id: '5' }] })).toEqual([])
    expect(readPageCursors({ pageCursors: [{ after_id: 5, after_value: 7 }] })).toEqual([])
  })

  it('drops extra keys of a cursor', () => {
    expect(readPageCursors({ pageCursors: [{ after_id: 5, evil: true }] })).toEqual([
      { after_id: 5 },
    ])
  })
})
