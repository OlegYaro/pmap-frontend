import { describe, expect, it } from 'vitest'
import { transactionRow } from '../../../test/transactions'
import { EMPTY_FORM, type FormValues } from './formSchema'
import { initialFromTransaction, toCreateBody, toUpdateBody } from './payload'

const form = (changes: Partial<FormValues>): FormValues => ({ ...EMPTY_FORM, ...changes })

describe('toCreateBody', () => {
  it('sends only the powiat for a minimal form', () => {
    expect(toCreateBody(form({ powiat: '0264' }))).toEqual({ powiat_code: '0264' })
  })

  it('sends a full form with numbers as numbers and the date as text', () => {
    const body = toCreateBody(
      form({
        powiat: '0264',
        gmina: '0264011',
        city: ' Bielsko ',
        district: 'Centrum',
        address: 'ul. Długa 1',
        date: '2026-03-15',
        price: '450000',
        area: '52,5',
        rooms: '3',
        floor: '2',
        market: 'pierwotny',
        function: 'mieszkalna',
        buildingId: 'B-7',
      }),
    )
    expect(body).toEqual({
      powiat_code: '0264',
      gmina_code: '0264011',
      city_name: 'Bielsko',
      district_name: 'Centrum',
      address: 'ul. Długa 1',
      transaction_date: '2026-03-15',
      price_premises: 450000,
      area_usable: 52.5,
      rooms: 3,
      floor: 2,
      market_type: 'pierwotny',
      function: 'mieszkalna',
      external_building_id: 'B-7',
    })
  })

  it('sends an exclusion reason for an excluded status', () => {
    expect(toCreateBody(form({ powiat: '0264', status: 'non_market' }))).toEqual({
      powiat_code: '0264',
      exclusion_reason: 'non_market',
    })
  })

  it('leaves out whitespace-only fields and keeps floor 0', () => {
    expect(toCreateBody(form({ powiat: '0264', city: '   ', floor: '0' }))).toEqual({
      powiat_code: '0264',
      floor: 0,
    })
  })
})

describe('initialFromTransaction', () => {
  it('turns every value into text and a missing reason into Clean', () => {
    const values = initialFromTransaction(
      transactionRow({
        id: 42,
        powiat_code: '0264',
        gmina_code: null,
        price_premises: 450000,
        area_usable: 52.5,
        rooms: 3,
        floor: 0,
        transaction_date: '2026-03-15',
        district_name: null,
        exclusion_reason: null,
      }),
    )
    expect(values).toEqual({
      powiat: '0264',
      gmina: '',
      city: 'Warszawa',
      district: '',
      address: 'ul. Marszałkowska 1',
      date: '2026-03-15',
      price: '450000',
      area: '52.5',
      rooms: '3',
      floor: '0',
      market: 'wtorny',
      function: 'mieszkalna',
      buildingId: 'B-1',
      status: 'clean',
    })
  })

  it('keeps an exclusion reason', () => {
    expect(
      initialFromTransaction(transactionRow({ exclusion_reason: 'package_deal' })).status,
    ).toBe('package_deal')
  })
})

describe('toUpdateBody', () => {
  const initial = initialFromTransaction(
    transactionRow({ id: 42, powiat_code: '0264', price_premises: 450000, rooms: 3 }),
  )

  it('sends one changed field', () => {
    expect(toUpdateBody({ ...initial, price: '460000' }, initial, false)).toEqual({
      price_premises: 460000,
    })
  })

  it('sends a cleared field as null', () => {
    expect(toUpdateBody({ ...initial, district: '' }, initial, false)).toEqual({
      district_name: null,
    })
  })

  it('sends nothing when nothing changed, also after spacing or number spelling', () => {
    expect(toUpdateBody(initial, initial, false)).toEqual({})
    expect(
      toUpdateBody({ ...initial, city: ' Warszawa ', price: '450000.0' }, initial, false),
    ).toEqual({})
  })

  it('does not send a field that was empty and stayed empty', () => {
    const empty = { ...initial, gmina: '' }
    expect(toUpdateBody({ ...empty, gmina: '  ' }, empty, false)).toEqual({})
  })

  it('sends a null exclusion reason for a change to Clean', () => {
    const excluded = { ...initial, status: 'non_market' }
    expect(toUpdateBody({ ...excluded, status: 'clean' }, excluded, false)).toEqual({
      exclusion_reason: null,
    })
    expect(toUpdateBody({ ...initial, status: 'package_deal' }, initial, false)).toEqual({
      exclusion_reason: 'package_deal',
    })
  })

  it('sends only the flag when it is checked without a change', () => {
    expect(toUpdateBody(initial, initial, true)).toEqual({ accept_registry: true })
  })

  it('sends the flag with a change', () => {
    expect(toUpdateBody({ ...initial, price: '460000' }, initial, true)).toEqual({
      price_premises: 460000,
      accept_registry: true,
    })
  })

  it('leaves the flag out when it is unchecked', () => {
    expect(toUpdateBody({ ...initial, rooms: '4' }, initial, false)).not.toHaveProperty(
      'accept_registry',
    )
  })
})
