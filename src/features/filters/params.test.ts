import { describe, expect, it } from 'vitest'
import type { TransactionFilters } from './model'
import { parseFilters, sameFilters, serializeFilters } from './params'

const parse = (search: string) => parseFilters(new URLSearchParams(search))

describe('parseFilters', () => {
  it('ignores unknown keys', () => {
    expect(parse('?foo=1&city_name=Warszawa&sort=rooms')).toEqual({ city_name: 'Warszawa' })
  })

  it('drops empty values and trims text', () => {
    expect(parse('?address=%20&district_name=%20Mokot%C3%B3w%20&city_name=')).toEqual({
      district_name: 'Mokotów',
    })
  })

  it('takes the first valid value of a repeated single key', () => {
    expect(parse('?city_name=Kraków&city_name=Warszawa').city_name).toBe('Kraków')
    expect(parse('?price_min=x&price_min=10').price_min).toBe(10)
  })

  it('validates territory code formats', () => {
    expect(parse('?powiat_code=26')).toEqual({})
    expect(parse('?voivodeship_code=1&gmina_code=12345678')).toEqual({})
    expect(parse('?voivodeship_code=14')).toEqual({ voivodeship_code: '14' })
  })

  it('fills missing parents from a child code', () => {
    expect(parse('?gmina_code=1465011')).toEqual({
      voivodeship_code: '14',
      powiat_code: '1465',
      gmina_code: '1465011',
    })
    expect(parse('?powiat_code=0264')).toEqual({ voivodeship_code: '02', powiat_code: '0264' })
  })

  it('drops a contradicting child with its children', () => {
    expect(parse('?voivodeship_code=12&powiat_code=1465&gmina_code=1465011')).toEqual({
      voivodeship_code: '12',
    })
    expect(parse('?powiat_code=1465&gmina_code=1261011')).toEqual({
      voivodeship_code: '14',
      powiat_code: '1465',
    })
    expect(parse('?voivodeship_code=12&gmina_code=1465011')).toEqual({ voivodeship_code: '12' })
  })

  it('reads non-negative prices and areas', () => {
    expect(parse('?price_min=200000&area_max=55.5')).toEqual({ price_min: 200000, area_max: 55.5 })
    expect(parse('?price_min=-5&area_min=abc&price_max=1e5&area_max=4,5')).toEqual({})
  })

  it('reads integer floors, negative allowed', () => {
    expect(parse('?floor_min=-1&floor_max=4')).toEqual({ floor_min: -1, floor_max: 4 })
    expect(parse('?floor_max=2.5&floor_min=x')).toEqual({})
  })

  it('reads rooms as a sorted list without duplicates', () => {
    expect(parse('?rooms=3&rooms=2&rooms=3&rooms=x&rooms=0&rooms=100').rooms).toEqual([2, 3])
    expect(parse('?rooms=0')).toEqual({})
  })

  it('reads real ISO dates only', () => {
    expect(parse('?date_from=2024-02-29').date_from).toBe('2024-02-29')
    expect(parse('?date_from=2023-02-29&date_to=01.02.2024')).toEqual({})
    expect(parse('?date_to=2024-13-01')).toEqual({})
  })

  it('reads run_id only as a UUID, lowercased', () => {
    expect(parse('?run_id=123')).toEqual({})
    expect(parse('?run_id=1B4E28BA-2FA1-11D2-883F-0016D3CCA427').run_id).toBe(
      '1b4e28ba-2fa1-11d2-883f-0016d3cca427',
    )
  })

  it('keeps known exclusion reasons in catalogue order', () => {
    expect(
      parse('?exclusion_reason=package_deal&exclusion_reason=bogus&exclusion_reason=clean')
        .exclusion_reason,
    ).toEqual(['clean', 'package_deal'])
    expect(parse('?exclusion_reason=bogus')).toEqual({})
  })

  it('keeps unknown functions', () => {
    expect(parse('?function=magazyn')).toEqual({ function: 'magazyn' })
  })

  it('ignores market_type, which is not a filter', () => {
    expect(parse('?market_type=wtorny&rooms=2')).toEqual({ rooms: [2] })
  })

  it('keeps a minimum above its maximum', () => {
    expect(
      parse('?price_min=500000&price_max=100000&date_from=2024-05-01&date_to=2024-01-01'),
    ).toEqual({
      price_min: 500000,
      price_max: 100000,
      date_from: '2024-05-01',
      date_to: '2024-01-01',
    })
  })
})

describe('serializeFilters', () => {
  it('repeats array keys and drops empty values', () => {
    const filters = { powiat_code: '0264', rooms: [2, 3], city_name: '', exclusion_reason: [] }
    expect(serializeFilters(filters).toString()).toBe('powiat_code=0264&rooms=2&rooms=3')
  })

  it('writes keys in canonical order', () => {
    const filters: TransactionFilters = { run_id: 'x', address: 'a', voivodeship_code: '14' }
    expect([...serializeFilters(filters).keys()]).toEqual(['voivodeship_code', 'address', 'run_id'])
  })

  it('round-trips a fully populated filter object', () => {
    const filters: TransactionFilters = {
      voivodeship_code: '14',
      powiat_code: '1465',
      gmina_code: '1465011',
      city_name: 'Warszawa',
      district_name: 'Mokotów',
      date_from: '2024-01-01',
      date_to: '2024-12-31',
      price_min: 200000,
      price_max: 750000.5,
      area_min: 30,
      area_max: 72.25,
      rooms: [1, 2, 5],
      floor_min: -1,
      floor_max: 10,
      function: 'mieszkalna',
      address: 'Marszałkowska 1/2',
      exclusion_reason: ['clean', 'non_market'],
      run_id: '1b4e28ba-2fa1-11d2-883f-0016d3cca427',
    }
    expect(parseFilters(serializeFilters(filters))).toEqual(filters)
  })

  it('compares filters by their URL form', () => {
    expect(sameFilters({ rooms: [2] }, { rooms: [2], city_name: '' })).toBe(true)
    expect(sameFilters({ rooms: [2] }, { rooms: [3] })).toBe(false)
  })
})
