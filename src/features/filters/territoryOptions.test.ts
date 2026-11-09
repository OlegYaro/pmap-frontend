import { describe, expect, it } from 'vitest'
import {
  buildTerritoryOptions,
  gminaChoices,
  powiatChoices,
  selectGmina,
  selectPowiat,
  selectVoivodeship,
} from './territoryOptions'

function row(
  voivodeship: [string, string],
  powiat: [string, string] | null = null,
  gmina: [string, string] | null = null,
) {
  return {
    voivodeship_teryt: voivodeship[0],
    voivodeship_name: voivodeship[1],
    powiat_teryt: powiat?.[0] ?? null,
    powiat_name: powiat?.[1] ?? null,
    gmina_teryt: gmina?.[0] ?? null,
    gmina_name: gmina?.[1] ?? null,
  }
}

const MAZ: [string, string] = ['14', 'mazowieckie']
const MAL: [string, string] = ['12', 'małopolskie']
const SLA: [string, string] = ['24', 'śląskie']
const POD: [string, string] = ['20', 'podlaskie']

const names = (list: { label: string }[]) => list.map((option) => option.label)

describe('buildTerritoryOptions', () => {
  it('splits flat rows into sorted levels', () => {
    const options = buildTerritoryOptions([
      row(MAZ),
      row(MAZ, ['1465', 'Warszawa'], ['1465011', 'Warszawa']),
      row(MAL, ['1261', 'Kraków']),
      row(MAL),
    ])
    expect(names(options.voivodeships)).toEqual(['małopolskie', 'mazowieckie'])
    expect(names(options.allPowiats)).toEqual(['Kraków', 'Warszawa'])
    expect(names(gminaChoices(options, '1465'))).toEqual(['Warszawa'])
    expect(options.voivodeships[0]).toEqual({
      code: '12',
      name: 'małopolskie',
      label: 'małopolskie',
    })
  })

  it('sorts with Polish collation', () => {
    const options = buildTerritoryOptions([
      row(SLA),
      row(['26', 'świętokrzyskie']),
      row(['28', 'warmińsko-mazurskie']),
    ])
    expect(names(options.voivodeships)).toEqual([
      'śląskie',
      'świętokrzyskie',
      'warmińsko-mazurskie',
    ])
  })

  it('creates no options for missing powiats or gminas', () => {
    const options = buildTerritoryOptions([row(MAZ)])
    expect(options.voivodeships).toHaveLength(1)
    expect(options.allPowiats).toEqual([])
    expect(options.gminasByPowiat.size).toBe(0)
  })

  it('adds the code to equal gmina names under one powiat', () => {
    const dol: [string, string] = ['02', 'dolnośląskie']
    const options = buildTerritoryOptions([
      row(dol, ['0201', 'bolesławiecki'], ['0201011', 'Bolesławiec']),
      row(dol, ['0201', 'bolesławiecki'], ['0201022', 'Bolesławiec']),
      row(dol, ['0201', 'bolesławiecki'], ['0201032', 'Gromadka']),
    ])
    expect(names(gminaChoices(options, '0201'))).toEqual([
      'Bolesławiec (0201011)',
      'Bolesławiec (0201022)',
      'Gromadka',
    ])
  })

  it('adds the code to equal powiat names across voivodeships', () => {
    const options = buildTerritoryOptions([
      row(SLA, ['2402', 'bielski']),
      row(POD, ['2003', 'bielski']),
    ])
    expect(names(options.allPowiats)).toEqual(['bielski (2003)', 'bielski (2402)'])
    expect(names(powiatChoices(options, '24'))).toEqual(['bielski (2402)'])
  })

  it('narrows choices by the parent', () => {
    const options = buildTerritoryOptions([
      row(MAZ, ['1465', 'Warszawa']),
      row(MAL, ['1261', 'Kraków']),
      row(MAL, ['1206', 'krakowski']),
    ])
    // In Polish "ó" is a letter after "o", so "krakowski" comes before "Kraków".
    expect(names(powiatChoices(options, '12'))).toEqual(['krakowski', 'Kraków'])
    expect(names(powiatChoices(options))).toEqual(['krakowski', 'Kraków', 'Warszawa'])
    expect(powiatChoices(options, '99')).toEqual([])
    expect(gminaChoices(options)).toEqual([])
  })

  it('indexes every level by code', () => {
    const options = buildTerritoryOptions([row(MAZ, ['1465', 'Warszawa'], ['1465011', 'Warszawa'])])
    expect(options.byCode.voivodeship.get('14')?.name).toBe('mazowieckie')
    expect(options.byCode.powiat.get('1465')?.name).toBe('Warszawa')
    expect(options.byCode.gmina.get('1465011')?.name).toBe('Warszawa')
  })
})

describe('cascade', () => {
  const full = { voivodeship_code: '14', powiat_code: '1465', gmina_code: '1465011', rooms: [2] }

  it('clears children when the voivodeship changes', () => {
    expect(selectVoivodeship(full, '12')).toEqual({ voivodeship_code: '12', rooms: [2] })
    expect(selectVoivodeship(full, undefined)).toEqual({ rooms: [2] })
  })

  it('keeps children when the same parent is selected again', () => {
    expect(selectVoivodeship(full, '14')).toBe(full)
    expect(selectPowiat(full, '1465')).toBe(full)
  })

  it('fills parents from a child', () => {
    expect(selectPowiat({}, '1261')).toEqual({ voivodeship_code: '12', powiat_code: '1261' })
    expect(selectGmina({}, '1261011')).toEqual({
      voivodeship_code: '12',
      powiat_code: '1261',
      gmina_code: '1261011',
    })
  })

  it('clears the gmina when the powiat changes or is cleared', () => {
    expect(selectPowiat(full, '1434')).toEqual({
      voivodeship_code: '14',
      powiat_code: '1434',
      rooms: [2],
    })
    expect(selectPowiat(full, undefined)).toEqual({ voivodeship_code: '14', rooms: [2] })
    expect(selectGmina(full, undefined)).toEqual({
      voivodeship_code: '14',
      powiat_code: '1465',
      rooms: [2],
    })
  })
})
