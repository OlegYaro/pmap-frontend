import { describe, expect, it } from 'vitest'
import { buildChips, type NameLookup } from './chips'
import { FILTER_FIELDS, type FilterField, type TransactionFilters } from './model'
import { parseFilters, serializeFilters } from './params'

const NAMES: Record<string, string> = { '14': 'mazowieckie', '1465': 'Warszawa' }
const nameOf: NameLookup = (_level, code) => NAMES[code] ?? code

const labels = (search: string, fields: readonly FilterField[] = FILTER_FIELDS) =>
  buildChips(parseFilters(new URLSearchParams(search)), nameOf, fields).map((chip) => chip.label)

/** Removes the chip labelled `label` and gives the resulting URL search. */
function removeChip(search: string, label: string) {
  const filters = parseFilters(new URLSearchParams(search))
  const chip = buildChips(filters, nameOf).find((item) => item.label === label)
  if (!chip) throw new Error(`no chip ${label}`)
  return serializeFilters(chip.remove(filters)).toString()
}

describe('buildChips', () => {
  it('has one chip per range and per room count, with 5+ grouped', () => {
    expect(labels('?rooms=2&rooms=6&rooms=7&price_min=200000&price_max=500000')).toEqual([
      'Price: 200,000 – 500,000 PLN',
      'Rooms: 2',
      'Rooms: 5+',
    ])
  })

  it('shows the first 8 characters of the run id, last', () => {
    expect(labels('?run_id=1b4e28ba-2fa1-11d2-883f-0016d3cca427&rooms=1')).toEqual([
      'Rooms: 1',
      'Run: 1b4e28ba',
    ])
  })

  it('names territories and falls back to the code', () => {
    expect(labels('?powiat_code=1465&gmina_code=1465011')).toEqual([
      'Voivodeship: mazowieckie',
      'Powiat: Warszawa',
      'Gmina: 1465011',
    ])
  })

  it('formats one-sided ranges in en-US', () => {
    expect(labels('?area_min=40&date_to=2024-12-31&floor_max=3')).toEqual([
      'Date: up to 12/31/2024',
      'Area: from 40 m²',
      'Floor: up to 3',
    ])
    expect(labels('?date_from=2024-01-01&date_to=2024-12-31&floor_min=-1&floor_max=2')).toEqual([
      'Date: 1/1/2024 – 12/31/2024',
      'Floor: -1 – 2',
    ])
  })

  it('uses readable labels for categories and quotes the address', () => {
    expect(labels('?function=magazyn&exclusion_reason=clean&address=Marsz')).toEqual([
      'Function: magazyn',
      'Rows: Clean',
      'Address: "Marsz"',
    ])
  })

  it('follows the panel field order', () => {
    expect(
      labels(
        '?district_name=Mokot%C3%B3w&city_name=Warszawa&exclusion_reason=non_market&function=biurowa&floor_min=1&rooms=3&area_max=60&price_max=9&date_from=2024-01-01&voivodeship_code=14',
      ),
    ).toEqual([
      'Voivodeship: mazowieckie',
      'Date: from 1/1/2024',
      'Price: up to 9 PLN',
      'Area: up to 60 m²',
      'Rooms: 3',
      'Floor: from 1',
      'Function: Office',
      'Rows: Non-market',
      'City: Warszawa',
      'District: Mokotów',
    ])
  })

  it('leaves out fields that are not shown', () => {
    const fields = FILTER_FIELDS.filter((field) => field !== 'rows')
    expect(labels('?exclusion_reason=clean&rooms=2', fields)).toEqual(['Rooms: 2'])
  })

  it('gives no chips without filters', () => {
    expect(buildChips({} satisfies TransactionFilters, nameOf)).toEqual([])
  })
})

describe('removing a chip', () => {
  it('clears both ends of a range', () => {
    expect(
      removeChip('?price_min=200000&price_max=500000&rooms=2', 'Price: 200,000 – 500,000 PLN'),
    ).toBe('rooms=2')
  })

  it('clears every count of five or more for 5+', () => {
    expect(removeChip('?rooms=2&rooms=5&rooms=9', 'Rooms: 5+')).toBe('rooms=2')
    expect(removeChip('?rooms=2&rooms=5', 'Rooms: 2')).toBe('rooms=5')
  })

  it('clears the levels below a territory', () => {
    expect(
      removeChip(
        '?voivodeship_code=14&powiat_code=1465&gmina_code=1465011',
        'Voivodeship: mazowieckie',
      ),
    ).toBe('')
    expect(removeChip('?powiat_code=1465&gmina_code=1465011', 'Powiat: Warszawa')).toBe(
      'voivodeship_code=14',
    )
  })

  it('removes one row status', () => {
    expect(removeChip('?exclusion_reason=clean&exclusion_reason=package_deal', 'Rows: Clean')).toBe(
      'exclusion_reason=package_deal',
    )
  })

  it('removes a text filter', () => {
    expect(removeChip('?address=Marsz&city_name=Warszawa', 'Address: "Marsz"')).toBe(
      'city_name=Warszawa',
    )
  })
})
