import { describe, expect, it } from 'vitest'
import { pricePerM2, statusOf } from './cells'

describe('pricePerM2', () => {
  it('divides the price by the area and rounds to whole złoty', () => {
    expect(pricePerM2({ price_premises: 455000, area_usable: 38.5 })).toBe(11818)
    expect(pricePerM2({ price_premises: 500000, area_usable: 40 })).toBe(12500)
  })

  it('is null without a price or a positive area', () => {
    expect(pricePerM2({ price_premises: 455000, area_usable: null })).toBeNull()
    expect(pricePerM2({ price_premises: 455000 })).toBeNull()
    expect(pricePerM2({ price_premises: null, area_usable: 40 })).toBeNull()
    expect(pricePerM2({ price_premises: 455000, area_usable: 0 })).toBeNull()
  })
})

describe('statusOf', () => {
  it('calls a row without a reason clean', () => {
    expect(statusOf({ exclusion_reason: null })).toEqual({ kind: 'clean', label: 'Clean' })
    expect(statusOf({})).toEqual({ kind: 'clean', label: 'Clean' })
  })

  it('labels a known reason', () => {
    expect(statusOf({ exclusion_reason: 'package_deal' })).toEqual({
      kind: 'excluded',
      label: 'Package deal',
    })
  })

  it('shows an unknown reason as it is', () => {
    expect(statusOf({ exclusion_reason: 'duplicate' })).toEqual({
      kind: 'excluded',
      label: 'duplicate',
    })
  })
})
